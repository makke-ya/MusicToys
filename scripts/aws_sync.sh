#!/bin/bash

cd `dirname "$0"`
cd ..
aws s3 sync . s3://chord-quiz-bucket \
    --exclude ".git/*" \
    --exclude "backend/*" \
    --exclude "docs/*" \
    --exclude "scripts/*" \
    --exclude "static/images/custom/*" \
    --exclude ".gitignore" \
    --exclude "README.md"