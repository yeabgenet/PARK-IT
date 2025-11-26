"""
YOLO-based parking spot detection service
"""
import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image
import os
from django.conf import settings


class YOLODetectionService:
    """
    Service for detecting cars in parking spots using YOLO model
    """
    
    def __init__(self):
        # Paths to check for YOLO model files
        self.possible_paths = [
            os.path.join(settings.BASE_DIR, 'core'),
            os.path.join(settings.BASE_DIR.parent, 'Car_Parking_Space_Detection-main', 'Car_Parking_Space_Detection-main', 'Source Code'),
            os.path.join(settings.BASE_DIR.parent),
            settings.BASE_DIR
        ]
        
        self.initialized = False
        self.net = None
        
        # Try to load model from possible paths
        for path in self.possible_paths:
            weights_path = os.path.join(path, 'yolov3.weights')
            config_path = os.path.join(path, 'yolov3.cfg')
            
            if os.path.exists(weights_path) and os.path.exists(config_path):
                try:
                    print(f"Loading YOLO model from {path}")
                    self.net = cv2.dnn.readNet(weights_path, config_path)
                    self.initialized = True
                    break
                except Exception as e:
                    print(f"Error loading YOLO from {path}: {e}")
        
        if not self.initialized:
            print("YOLO model files not found. Detection will use fallback method.")
            print(f"Searched in: {self.possible_paths}")
        
        # Classes we want to detect (COCO dataset)
        self.classes = ["person", "bicycle", "car", "motorbike", "aeroplane", "bus", "train", "truck"]
        
    def detect_from_base64(self, image_base64):
        """
        Detect cars in an image provided as base64 string
        
        Args:
            image_base64: Base64 encoded image string
            
        Returns:
            dict: Detection results with is_occupied and confidence
        """
        try:
            # Decode base64 to image
            image_data = base64.b64decode(image_base64.split(',')[1] if ',' in image_base64 else image_base64)
            image = Image.open(BytesIO(image_data))
            
            # Convert to numpy array
            img_array = np.array(image)
            
            # Convert RGB to BGR for OpenCV
            if len(img_array.shape) == 3:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            return self.detect_cars(img_array)
            
        except Exception as e:
            print(f"Error detecting from base64: {e}")
            return {
                'is_occupied': False,
                'confidence': 0.0,
                'error': str(e)
            }
    
    def detect_cars(self, image):
        """
        Detect cars in an image using YOLO
        
        Args:
            image: OpenCV image (numpy array)
            
        Returns:
            dict: Detection results including processed image
        """
        if not self.initialized:
            # Fallback: simple detection based on image analysis
            return self._fallback_detection(image)
        
        try:
            # Prepare image for YOLO
            height, width = image.shape[:2]
            blob = cv2.dnn.blobFromImage(
                image, 
                1/255.0, 
                (416, 416), 
                swapRB=True, 
                crop=False
            )
            
            # Set input and forward pass
            self.net.setInput(blob)
            layer_names = self.net.getLayerNames()
            output_layers = [layer_names[i - 1] for i in self.net.getUnconnectedOutLayers()]
            outputs = self.net.forward(output_layers)
            
            # Process detections
            boxes = []
            confidences = []
            class_ids = []
            
            for output in outputs:
                for detection in output:
                    scores = detection[5:]
                    class_id = np.argmax(scores)
                    confidence = scores[class_id]
                    
                    # Check if detected object is a vehicle
                    if confidence > 0.5 and class_id < len(self.classes):
                        # Object detected - parking spot is occupied
                        center_x = int(detection[0] * width)
                        center_y = int(detection[1] * height)
                        w = int(detection[2] * width)
                        h = int(detection[3] * height)
                        
                        x = int(center_x - w / 2)
                        y = int(center_y - h / 2)
                        
                        boxes.append([x, y, w, h])
                        confidences.append(float(confidence))
                        class_ids.append(class_id)
            
            # Apply non-maximum suppression
            indices = cv2.dnn.NMSBoxes(boxes, confidences, 0.5, 0.4)
            
            is_occupied = False
            max_confidence = 0.0
            vehicle_count = 0
            
            if len(indices) > 0:
                is_occupied = True
                vehicle_count = len(indices)
                
                # Draw bounding boxes
                for i in indices.flatten():
                    box = boxes[i]
                    x, y, w, h = box[0], box[1], box[2], box[3]
                    
                    # Draw rectangle
                    color = (0, 255, 0) # Green
                    cv2.rectangle(image, (x, y), (x + w, y + h), color, 2)
                    
                    # Draw label
                    label = f"{self.classes[class_ids[i]]}: {confidences[i]:.2f}"
                    cv2.putText(image, label, (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                    
                    max_confidence = max(max_confidence, confidences[i])
            else:
                max_confidence = 0.95 # High confidence it's empty
            
            # Convert processed image to base64
            _, buffer = cv2.imencode('.jpg', image)
            processed_image_b64 = base64.b64encode(buffer).decode('utf-8')
            
            return {
                'is_occupied': is_occupied,
                'confidence': max_confidence,
                'vehicle_count': vehicle_count,
                'processed_image': f"data:image/jpeg;base64,{processed_image_b64}"
            }
            
        except Exception as e:
            print(f"Error in YOLO detection: {e}")
            return self._fallback_detection(image)
    
    def _fallback_detection(self, image):
        """
        Fallback detection method using simple image analysis
        This is used when YOLO is not available
        """
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Calculate image statistics
            mean_brightness = np.mean(gray)
            std_brightness = np.std(gray)
            
            # Simple heuristic: if image has high variance and moderate brightness,
            # likely contains a car
            is_occupied = std_brightness > 40 and 50 < mean_brightness < 200
            confidence = min(std_brightness / 100, 0.8)
            
            # Draw overlay on image for fallback visualization
            height, width = image.shape[:2]
            color = (0, 0, 255) if is_occupied else (0, 255, 0)
            status_text = "OCCUPIED" if is_occupied else "AVAILABLE"
            
            # Draw border
            cv2.rectangle(image, (0, 0), (width-1, height-1), color, 5)
            
            # Draw text box
            cv2.rectangle(image, (0, 0), (width, 40), color, -1)
            cv2.putText(image, f"{status_text} (Fallback)", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
            # Convert processed image to base64
            _, buffer = cv2.imencode('.jpg', image)
            processed_image_b64 = base64.b64encode(buffer).decode('utf-8')
            
            return {
                'is_occupied': is_occupied,
                'confidence': confidence,
                'method': 'fallback',
                'note': 'Using fallback detection method (YOLO weights missing)',
                'processed_image': f"data:image/jpeg;base64,{processed_image_b64}"
            }
            
        except Exception as e:
            print(f"Error in fallback detection: {e}")
            return {
                'is_occupied': False,
                'confidence': 0.0,
                'error': str(e)
            }
    
    def detect_from_file(self, file_path):
        """
        Detect cars from an image file
        
        Args:
            file_path: Path to image file
            
        Returns:
            dict: Detection results
        """
        try:
            image = cv2.imread(file_path)
            if image is None:
                raise ValueError(f"Could not read image from {file_path}")
            
            return self.detect_cars(image)
            
        except Exception as e:
            print(f"Error detecting from file: {e}")
            return {
                'is_occupied': False,
                'confidence': 0.0,
                'error': str(e)
            }


# Singleton instance
_detector = None

def get_detector():
    """Get or create YOLO detector instance"""
    global _detector
    if _detector is None:
        _detector = YOLODetectionService()
    return _detector
