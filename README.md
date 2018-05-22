
# TextFSM Workbench

A small web-based application for real-time [TextFSM](https://github.com/google/textfsm) parsing in your browser.

## What is it?

A small Flask application that exposes:
- A WebSocket endpoint that takes data and TextFSM template, returns the parsed result
- Webpage that connects to the WS endpoint from Javascript


## Why?

I recently had to do a fair bit of work with TextFSM templates. Being spoiled by websites as regex101.com and regextester.com, I tried to make something similar for TextFSM. 

The app works as intended and is mostly done. What could/should be improved is resizing and the proportions on on small screens; currently the textareas become unnecessarily small and the Example buttons overlap with the divs. 


## Installation and usage


- Install requirements.txt in a Python 3.6 virtualenv
  - If you don't have this python version, install it with [pyenv](https://github.com/pyenv/pyenv) and create an environment with [pyenv-virtualenv](https://github.com/pyenv/pyenv-virtualenv)
- Activate the virtualenv, start the server with `python main.py`
- Navigate to http://127.0.0.1:5001 in your browser
- Try the examples, or paste your own data and templates
