import re, json, wikipedia
from server.lib.types import WebsiteCategory, ModelName
from server.lib.utils import prompt_llm, nlp

def _is_factual_claim(token: str) -> bool:
    """
    A basic heuristic to decide if a sentence likely contains a factual claim.
    This function checks for digits, percentages, years, and specific claim-indicative keywords.
    """
    # Check for digits, percentages, or years
    # if re.search(r'\d', sentence):
    #     return True

    # List of keywords that might indicate a factual assertion
    claim_keywords = ['report', 'claim', 'states', 'announce', 'reveal', 'according to', 'evidenced', 'found', 'is', 'are']
    for kw in claim_keywords:
        if kw in token.lower().split():
            return True
    return False


async def _extract_claims(webpage_text: str) -> list[str]:
    doc = nlp(webpage_text)
    claims = []
    for sent in doc.sents:
        for token in sent.text.split('\n'):
            if _is_factual_claim(token):
                claims.append(token)
            if len(claims) > 7: break
        if len(claims) > 7: break
    print('claims:', claims)
    return claims


async def _search_for_evidence(claims: list[str]) -> dict[str, list[str]]:
    '''
    Searches Wikipedia for relevant evidence based on extracted claims.

    Args:
        claims (list[str]): List of factual claims extracted from the webpage.

    Returns:
        dict[str, list[str]]: A dictionary mapping each claim to a list of relevant Wikipedia snippets.
    '''
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


async def _fact_check_with_CoT(claims_with_evidence: dict[str, list[str]], category: WebsiteCategory, model_name: ModelName) -> str:
    '''
    Uses CoT reasoning to fact-check claims with evidence.

    Args:
        claims_with_evidence (dict[str, list[str]]): Claims and their corresponding Wikipedia evidence.
        model_name (ModelName): The LLM model to use.

    Returns:
        str: The structured fact-checking report.
    '''
    response_types = '{True, False, Misleading, Needs More Evidence}'

    prompt = f'''
    You are an AI fact-checker. Using **Chain-of-Thought reasoning**, verify the following claims based on the provided Wikipedia evidence. The claims are taken from a website of category "{category}".

    ### **Step-by-Step Fact-Checking Process**:
    1. **Identify the Claim** – Read the claim carefully.
    2. **Review Evidence** – Examine the retrieved Wikipedia snippets.
    3. **Compare and Analyze** – Determine if the evidence fully supports, partially supports, contradicts, or lacks sufficient detail for the claim.
    4. **Final Judgment** – Label each claim as one of: {response_types}.
    5. **Justification** – Provide a brief but clear explanation for your decision.

    ### **Claims and Evidence**:
    {json.dumps(claims_with_evidence, indent=4)}

    Now, follow the fact-checking process above and provide a concise, structured response for each claim. Your response will be read by the user.
    '''

    return await prompt_llm(prompt, model_name)


async def fact_check(webpage_text: str, category: WebsiteCategory, model_name: ModelName) -> str:
    # Step 1: Extract claims from webpage text
    claims = await _extract_claims(webpage_text)
    # Step 2: Retrieve Wikipedia evidence
    claim_evidence = await _search_for_evidence(claims)
    # Step 3: Perform fact-checking using CoT reasoning
    res = await _fact_check_with_CoT(claim_evidence, category, model_name)
    print('res:', res)
    return res