from flask import Flask
from flask import render_template
from flask import request
from werkzeug.utils import secure_filename

app = Flask(__name__)


@app.route('/')
def hello():
    return 'Hello World!'


@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        f = request.files['file']
        filename = secure_filename(f.filename) + '___'
        print(filename)
        f.save(filename)
        return "success"

    return ''' <!doctype html> 
            <title>Upload new File</title> 
            <h1>Upload new File</h1>
             <form action="" method=post enctype=multipart/form-data>   
            <p><input type=file name=file>      <input type=submit value=Upload> </form> '''


if __name__ == '__main__':
    app.run(debug=True)