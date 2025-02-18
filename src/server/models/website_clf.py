from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch
from server.lib.types import WebsiteCategory
from server.lib.constants import ITOS, ModelConfig, locate

def encode_keywords(keywords: str, tokenizer: AutoTokenizer, squeeze: bool = True) -> dict[str, torch.Tensor]:
    inputs = tokenizer(
        keywords, 
        padding='max_length', 
        truncation=True, 
        max_length=ModelConfig.max_token_len, 
        return_tensors='pt'
    )
    input_ids = inputs['input_ids'].to(ModelConfig.device)
    attention_mask = inputs['attention_mask'].to(ModelConfig.device)
    return {
        'input_ids': input_ids.squeeze(0) if squeeze else input_ids,
        'attention_mask': attention_mask.squeeze(0) if squeeze else attention_mask
    }


def load_model_and_tokenizer() -> tuple[AutoModelForSequenceClassification, AutoTokenizer]:
    model_dir = locate('../models/website_clf_fp16')
    best_model = AutoModelForSequenceClassification.from_pretrained(model_dir).to(ModelConfig.device)
    tokenizer = AutoTokenizer.from_pretrained('distilbert-base-uncased')
    return best_model, tokenizer


async def classify(webpage_text: str, model: AutoModelForSequenceClassification, tokenizer: AutoTokenizer) -> WebsiteCategory:
    out = model(**encode_keywords(webpage_text, tokenizer, squeeze=False))
    label = torch.argmax(out.logits).item()
    return ITOS[label]