FROM python:3.8

# Download cache lists and install minimal versions
RUN apt-get update && \
    apt-get -yq install --no-install-recommends pipenv && \
    # Clean up anything not needed to minimize image size and remove cache lists
    apt-get autoremove -yq && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy in files
COPY . .

# Install using system pip
RUN pipenv install --system

# Define port we are listening on
EXPOSE 5001

# App to run
ENTRYPOINT [ "python" ]

# Arguments to app
CMD [ "main.py" ]