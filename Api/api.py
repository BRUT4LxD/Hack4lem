from flask import Flask
import pickle
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import CountVectorizer, TfidfTransformer
from os import path
import re

def save_model(name, model):
    with open(name, 'wb') as fid:
        pickle.dump(model, fid) 
        
def load_model(name):
    with open(name, 'rb') as fid:
        return pickle.load(fid)
        
def process_tweet(tweet):
    return " ".join(re.sub("(@[A-Za-z0-9]+)|([^0-9A-Za-z \t])", " ",tweet.lower()).split())
    
model = {};        
app = Flask(__name__)

def loadModel(): 
    model = load_model('svm.pkl');

@app.route('/reports/hate', methods=['POST'])
def login():
    return method.data


@app.route("/detect/hate", methods=['POST'])
def logout():
    y = 1
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0, stratify = None)
    count_vect = CountVectorizer(stop_words='english')
    transformer = TfidfTransformer(norm='l2',sublinear_tf=True)
    x_train_counts = count_vect.fit_transform(X_train)
    x_train_tfidf = transformer.fit_transform(x_train_counts)
    x_test_counts = count_vect.transform(X_test)
    x_test_tfidf = transformer.transform(x_test_counts)
    model = load_model('svm.pkl')
    x = model.predict(x_test_tfidf)
    
    
@app.route('/settings', methods=['GET', 'POST'])
def settings():
    if request.method == 'POST':
        return request.data
    return "settings"

if __name__ == "__main__":
    
    app.run(debug=True)
