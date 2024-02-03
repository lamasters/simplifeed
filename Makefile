.PHONY: deploy
deploy:
	appwrite functions createDeployment \
    --functionId=652ae2169262a1dfc5f8 \
    --entrypoint='get_articles.py' \
	--commands='pip install -r requirements.txt' \
    --code="./functions/get_articles" \
    --activate=true
