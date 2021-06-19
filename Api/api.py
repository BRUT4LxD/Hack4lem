from flask import Flask, request, jsonify
import pickle
import nltk
from nltk.tokenize import TweetTokenizer
from nltk.stem import PorterStemmer
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import string
import re
import requests
import json


def save_model(name, model):
    with open(name, 'wb') as fid:
        pickle.dump(model, fid) 
        
def load_model(name):
    with open(name, 'rb') as fid:
        return pickle.load(fid)
        
logprior = load_model('logprior.pkl')
loglikelihood = load_model('loglikelihood.pkl')   
app = Flask(__name__)

def process_tweet(tweet):
    stemmer = PorterStemmer()
    stopwords_english = stopwords.words('english')
    tweet = re.sub(r'\$\w*', '', tweet)
    tweet = re.sub(r'^RT[\s]+', '', tweet)
    tweet = re.sub(r'https?:\/\/.*[\r\n]*', '', tweet)
    tweet = re.sub(r'#', '', tweet)
    tokenizer = TweetTokenizer(preserve_case=False, strip_handles=True,reduce_len=True)
    tweet_tokens = tokenizer.tokenize(tweet)

    tweets_clean = []
    for word in tweet_tokens:
        if (word not in stopwords_english and  
                word not in string.punctuation): 
            stem_word = stemmer.stem(word)
            tweets_clean.append(stem_word)

    return tweets_clean
    
def naive_bayes_predict(tweet, logprior, loglikelihood):
    word_l = process_tweet(tweet)
    p = logprior
    for word in word_l:
        if word in loglikelihood:
            p += loglikelihood[word]

    return p  
    
@app.route("/detect/hate", methods=['POST'])
def detect():
    text = request.json['text']
    url = 'https://translation.googleapis.com/language/translate/v2?key=AIzaSyAifjeunmPMgvz4ptXG9nJl29Wyk4GjnFk&target=en&source=pl&q='
    url = url + text
    response = requests.post(url, data = {})
    json_data = json.loads(response.text)
    translation = json_data['data']['translations'][0]['translatedText'];
    print(translation)
    result = naive_bayes_predict(translation, logprior, loglikelihood)
    print(text)
    print(result)
    return str(result)
    
if __name__ == "__main__":
    app.run(debug=True)
