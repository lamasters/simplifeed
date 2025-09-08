deploy_ai:
	appwrite functions create-deployment \
	--function-id=65bed72070bb85067dd9 \
	--entrypoint='summarize.py' \
	--commands='pip install -r requirements.txt' \
	--code="./functions/summarize_article" \
	--activate=true

create_ai:
	appwrite functions create \
	--function-id=65bed72070bb85067dd9 \
	--name="summarize_article" \
	--runtime=python-3.9 \
	--commands='pip install -r requirements.txt' \
	--provider-root-directory="./functions/summarize_article" \
	--entrypoint='summarize.py' \
	--timeout=30 \
	--enabled=true

deploy_record_listen_time:
	appwrite functions create-deployment \
	--function-id=674661f2001479869775 \
	--entrypoint='record_listen_time.py' \
	--commands='pip install -r requirements.txt' \
	--code="./functions/record_listen_time" \
	--activate=true

create_record_listen_time:
	appwrite functions create \
	--function-id=674661f2001479869775 \
	--name="record_listen_time" \
	--runtime=python-3.9 \
	--commands='pip install -r requirements.txt' \
	--provider-root-directory="./functions/record_listen_time" \
	--entrypoint='record_listen_time.py' \
	--timeout=30 \
	--enabled=true

deploy_index_news_feed:
	appwrite functions create-deployment \
	--function-id=679fc996043c9a90e2df \
	--entrypoint='index_news_feed.py' \
	--commands='pip install -r requirements.txt' \
	--code="./functions/index_news_feed" \
	--activate=true

create_index_news_feed:
	appwrite functions create \
	--function-id=679fc996043c9a90e2df \
	--name="index_news_feed" \
	--runtime=python-3.9 \
	--commands='pip install -r requirements.txt' \
	--provider-root-directory="./functions/index_news_feed" \
	--entrypoint='index_news_feed.py' \
	--timeout=360 \
	--enabled=true

deploy_index_podcast_feed:
	appwrite functions create-deployment \
	--function-id=679fe0e256c67950d62e \
	--entrypoint='index_podcast_feed.py' \
	--commands='pip install -r requirements.txt' \
	--code="./functions/index_podcast_feed" \
	--activate=true

create_index_podcast_feed:
	appwrite functions create \
	--function-id=679fe0e256c67950d62e \
	--name="index_podcast_feed" \
	--runtime=python-3.9 \
	--commands='pip install -r requirements.txt' \
	--provider-root-directory="./functions/index_podcast_feed" \
	--entrypoint='index_podcast_feed.py' \
	--timeout=360 \
	--enabled=true

deploy_create_news_feed:
	appwrite functions create-deployment \
	--function-id=67a12be8e3a2ad0d676e \
	--entrypoint='create_news_feed.py' \
	--commands='pip install -r requirements.txt' \
	--code="./functions/create_news_feed" \
	--activate=true

create_create_news_feed:
	appwrite functions create \
	--function-id=67a12be8e3a2ad0d676e \
	--name="create_news_feed" \
	--runtime=python-3.9 \
	--commands='pip install -r requirements.txt' \
	--provider-root-directory="./functions/create_news_feed" \
	--entrypoint='create_news_feed.py' \
	--timeout=300 \
	--enabled=true

deploy_create_podcast_feed:
	appwrite functions create-deployment \
	--function-id=67a147e4791d9ec6e02f \
	--entrypoint='create_podcast_feed.py' \
	--commands='pip install -r requirements.txt' \
	--code="./functions/create_podcast_feed" \
	--activate=true

create_create_podcast_feed:
	appwrite functions create \
	--function-id=67a147e4791d9ec6e02f \
	--name="create_podcast_feed" \
	--runtime=python-3.9 \
	--commands='pip install -r requirements.txt' \
	--provider-root-directory="./functions/create_podcast_feed" \
	--entrypoint='create_podcast_feed.py' \
	--timeout=300 \
	--enabled=true

deploy_get_article:
	appwrite functions create-deployment \
	--function-id=67a15bad9774f8a009c5 \
	--entrypoint='get_article.py' \
	--commands='pip install -r requirements.txt' \
	--code="./functions/get_article" \
	--activate=true

create_get_article:
	appwrite functions create \
	--function-id=67a15bad9774f8a009c5 \
	--name="get_article" \
	--runtime=python-3.9 \
	--commands='pip install -r requirements.txt' \
	--provider-root-directory="./functions/get_article" \
	--entrypoint='get_article.py' \
	--timeout=30 \
	--enabled=true

deploy_scheduler:
	appwrite functions create-deployment \
	--function-id=67a165e260f7bd4375f4 \
	--entrypoint='scheduler.py' \
	--commands='pip install -r requirements.txt' \
	--code="./functions/scheduler" \
	--activate=true

create_scheduler:
	appwrite functions create \
	--function-id=67a165e260f7bd4375f4 \
	--name="scheduler" \
	--runtime=python-3.9 \
	--commands='pip install -r requirements.txt' \
	--provider-root-directory="./functions/scheduler" \
	--entrypoint='scheduler.py' \
	--timeout=900 \
	--enabled=true

deploy_all: deploy_ai deploy_record_listen_time deploy_index_news_feed deploy_index_podcast_feed deploy_create_news_feed deploy_create_podcast_feed deploy_get_article deploy_scheduler
	echo "All functions deployed."

create_all: create_ai create_record_listen_time create_index_news_feed create_index_podcast_feed create_create_news_feed create_create_podcast_feed create_get_article create_scheduler
	echo "All functions created."