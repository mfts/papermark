FROM gitpod/workspace-full

# Install pipenv if needed
RUN apt-get update && apt-get install -y pipenv

# Install Tinybird CLI
RUN pip install tinybird-cli

# python
RUN pyenv install 3.11 \
    && pyenv global 3.11
