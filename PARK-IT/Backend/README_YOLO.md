# YOLO Object Detection Setup

The Park-IT system comes with built-in YOLO object detection for parking spots. 

## Missing Model Files
If you see "Using fallback detection method" or "YOLO weights missing" in the app, it means the YOLO model files are not present.

To enable full YOLO detection with bounding boxes, you need to download the YOLOv3 weights file.

## How to Install Weights

1. Download the `yolov3.weights` file (approx. 237 MB).
   - You can download it from: https://pjreddie.com/media/files/yolov3.weights
   
2. Place the `yolov3.weights` file in one of these locations:
   - `Backend/` (same folder as manage.py)
   - `Backend/core/`
   - `Car_Parking_Space_Detection-main/Car_Parking_Space_Detection-main/Source Code/`

3. Ensure `yolov3.cfg` is also present (it should already be in the project).

## Verify Installation
Once the file is placed, restart the Django server:
```bash
python manage.py runserver
```

The system will automatically detect the weights file and switch from "Fallback" mode to "YOLO" mode.

## Fallback Mode
If the weights file is missing, the system uses a smart fallback method that analyzes image brightness and variance to guess if a spot is occupied. This allows you to test the system flow without downloading the large model file.
