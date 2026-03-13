FROM public.ecr.aws/lambda/python:3.12

COPY requirements.txt ${LAMBDA_TASK_ROOT}
RUN pip install -r requirements.txt

COPY . ${LAMBDA_TASK_ROOT}

CMD [ "main.handler" ]FROM public.ecr.aws/lambda/python:3.12

# Copy requirements and install
COPY requirements.txt ${LAMBDA_TASK_ROOT}
RUN pip install -r requirements.txt

# Copy your backend code
COPY . ${LAMBDA_TASK_ROOT}

# Point Lambda to your Mangum handler
CMD [ "main.handler" ]
