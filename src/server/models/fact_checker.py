import json, wikipedia
from server.lib.types import WebsiteCategory, ModelName
from server.lib.utils import prompt_llm

async def _extract_claims(webpage_text: str, category: WebsiteCategory) -> list[str]:
    claims = await prompt_llm(f'''
        Example: 
        - Given: "Mona Lisa, oil painting on a poplar wood panel by Leonardo da Vinci, probably the world’s most famous painting."
        - Expected response: ["Mona Lisa is Leonardo da Vinci's oil painting.", "Mona Lisa is probably the world's most famous painting."]

        Extract verifiable factual claims from the following webpage text of category "{category}":
        "{webpage_text}"
        Please only return a JSON array of extracted string claims (**list[str]**) found only inside the text.
    ''')
    claims = claims.replace('```json', '').replace('```', '')
    print('claims:', claims)
    if not ('[' in claims and ']' in claims and '"' in claims): raise ValueError('Invalid array of claims.')
    return json.loads(claims)


async def _search_for_evidence(claims: list[str]) -> dict[str, list[str]]:
    """
    Searches Wikipedia for relevant evidence based on extracted claims.

    Args:
        claims (list[str]): List of factual claims extracted from the webpage.

    Returns:
        dict[str, list[str]]: A dictionary mapping each claim to a list of relevant Wikipedia snippets.
    """
    claim_evidence = {}

    for claim in claims:
        try:
            # Step 1: Search Wikipedia for relevant pages
            search_results = wikipedia.search(claim, results=3)
            evidence_snippets = []

            for title in search_results:
                try:
                    # Step 2: Fetch Wikipedia page content
                    page = wikipedia.page(title)
                    page_content = page.content

                    # Step 3: Extract the most relevant paragraph
                    paragraphs = page_content.split("\n")
                    for paragraph in paragraphs:
                        if claim.lower() in paragraph.lower():
                            evidence_snippets.append(paragraph.strip())
                            break  # Take only the most relevant match

                except (wikipedia.DisambiguationError, wikipedia.PageError):
                    continue  # Skip if there are ambiguous or missing pages

            claim_evidence[claim] = evidence_snippets if evidence_snippets else ["No strong evidence found."]

        except Exception as e:
            claim_evidence[claim] = [f"Error retrieving evidence: {str(e)}"]

    return claim_evidence


async def fact_check(webpage_text: str, category: WebsiteCategory, model_name: ModelName) -> str:
    # Step 1: Extract claims from webpage text
    claims = await _extract_claims(webpage_text, category)
    # Step 2: Retrieve Wikipedia evidence
    claim_evidence = await _search_for_evidence(claims)
    # Step 3: Generate a structured response using LLM
    response_types = '{True, False, Misleading, Needs More Evidence}'
    return await prompt_llm(f'''
        Claims and Evidence:
        {json.dumps(claim_evidence, indent=4)}

        Based on the retrieved Wikipedia evidence, fact-check each claim.
        Classify each as {response_types} and explain briefly.
    ''', model_name)