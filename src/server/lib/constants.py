from transformers import TrainingArguments
import os

_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))  # path with respect to this file
locate = lambda x: os.path.join(_CURRENT_DIR, x)

OLLAMA_URL = 'http://localhost:11434/api/generate'
DEFAULT_GENAI_MODEL = 'deepseek-r1:1.5b'
NUM_CORES = os.cpu_count()

ITOS = {
    0: 'Computers and Technology',
    1: 'E-Commerce',
    2: 'Education',
    3: 'Food',
    4: 'Games',
    5: 'Health and Fitness',
    6: 'News',
    7: 'Social Networking and Messaging',
    8: 'Sports',
    9: 'Travel'
}

STOI = {v: k for k, v in ITOS.items()}

class ModelConfig:
    name = 'huawei-noah/TinyBERT_General_4L_312D'
    max_token_len = 32
    device = 'cpu'
    num_classes = 10
    batch_size = 16
    train_ratio = 0.8
    training_args = TrainingArguments(
        output_dir=locate('../models/website_clf_chkpts'),
        eval_strategy='epoch',  # Evaluate every epoch
        save_strategy='epoch',  # Save model every epoch
        learning_rate=5e-5,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        num_train_epochs=10,
        weight_decay=0.01,
        logging_dir=locate('../models/website_clf_logs'),  # Where to log progress
        logging_steps=10,  # Log every 10 steps
        save_total_limit=2,  # Keep only last 2 checkpoints
        load_best_model_at_end=True,  # Load the best model after training
        fp16=True
    )
