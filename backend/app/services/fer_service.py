from deepface import DeepFace
import numpy as np
from statistics import mean
from typing import List, Dict
import cv2
from io import BytesIO

class EmotionCapture:
    def __init__(self):
        self.model_name = "VGG-FER"
        self.sample_size = 3  
        self.min_confidence = 0.1  

    def capture_emotions(self, image_bytes: bytes) -> List[Dict[str, float]]:
        """Capture multiple emotion samples and return averaged results"""
        samples = []
        
        
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)  

    
        if image is None:
            raise ValueError("Failed to decode the image. Check the image format or input.")

        for _ in range(self.sample_size):
            result = DeepFace.analyze(
                img_path=image,
                actions=['emotion'],
                detector_backend="opencv",
                enforce_detection=False,
                silent=True
            )
            
            if isinstance(result, list):
                result = result[0] 
            
            samples.append(result["emotion"])
        
        return self._average_emotions(samples)

    def _average_emotions(self, samples: List[dict]) -> List[Dict[str, float]]:
        """Calculate average confidence for each emotion"""
        emotion_totals = {}
        
        
        for sample in samples:
            for emotion, confidence in sample.items():
                emotion_totals.setdefault(emotion.lower(), []).append(confidence / 100)  
        
        
        averaged = [
            {"emotion": e, "confidence": round(float(mean(confidences)), 4)} 
            for e, confidences in emotion_totals.items()
            if mean(confidences) >= self.min_confidence  
        ]
        
        
        return sorted(averaged, key=lambda x: x["confidence"], reverse=True)

