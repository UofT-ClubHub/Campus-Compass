#!/bin/bash

# Create virtual environment
if [ ! -d ".venv" ]; then
    python -m venv .venv
fi

# Activate virtual environment based on OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    source .venv/Scripts/activate
else
    # Linux/macOS
    source .venv/bin/activate
fi

# Install requirements
python -m pip install -r requirements.txt
python -m pip install torch torchvision torchaudio

# Run the main application
python main.py