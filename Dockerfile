FROM python:3.8 AS base

ENV PYTHONDONTWRITEBYTECODE 1
ENV PIPENV_VENV_IN_PROJECT 1

RUN pip install pipenv
ADD Pipfile.lock .
RUN pipenv sync

ENV PATH /.venv/bin:$PATH

RUN useradd --create-home workbench
USER workbench
WORKDIR /home/workbench

ADD main.py .
ADD templates templates
ADD static static

EXPOSE 5001
ENV PYTHONUNBUFFERED 1
ENTRYPOINT [ "pipenv", "run", "python", "main.py"]
