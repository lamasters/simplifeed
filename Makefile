all: build

.PHONY: build
build: build-functions
	npm run build

build-functions:
	cd functions && tar -czf get_articles.tar.gz ./get_articles
	mv functions/*.tar.gz function_builds

.PHONY: deploy
deploy:
	appwrite functions createDeployment \
    --functionId=652ae2169262a1dfc5f8 \
    --entrypoint='get_articles.py' \
	--commands='pip install -r requirements.txt' \
    --code="./functions/get_articles" \
    --activate=true
