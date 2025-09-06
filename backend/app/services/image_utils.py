import os
import cv2
import numpy as np
from datetime import datetime
from app.core.config import settings

def save_image(image_bytes: bytes, user_id: int, question_id: int) -> str:
    os.makedirs(settings.storage_path, exist_ok=True)
    filename = f"{user_id}_{question_id}_{datetime.now().timestamp()}.jpg"
    filepath = os.path.join(settings.storage_path, filename)
    
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    cv2.imwrite(filepath, img)
    
    return filepath