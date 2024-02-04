deploy_ai:
	appwrite functions createDeployment \
    --functionId=65bed72070bb85067dd9 \
    --entrypoint='summarize.py' \
    --commands='pip install -r requirements.txt' \
    --code="./functions/summarize_article" \
    --activate=true

deploy_articles:
	appwrite functions createDeployment \
    --functionId=652ae2169262a1dfc5f8 \
    --entrypoint='get_articles.py' \
	--commands='pip install -r requirements.txt' \
    --code="./functions/get_articles" \
    --activate=true