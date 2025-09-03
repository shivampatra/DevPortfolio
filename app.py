import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)



import json
from flask import Flask, render_template, request, redirect, url_for


app = Flask(__name__)

# Sample project data - in a real app, you might use a database
# Load data from JSON files
def load_json(filename):
    with open(f'data/{filename}', 'r') as f:
        return json.load(f)

projects = load_json('projects.json')
skills = load_json('skills.json')
tech_stack = load_json('tech_stack.json')


@app.route('/')
def index():
    return render_template('index.html', 
                           projects=projects, 
                           skills=skills, 
                           tech_stack=tech_stack)

@app.route('/projects/<project_id>')
def project_detail(project_id):
    # In a real app, you'd fetch the specific project from database
    # Here we're just passing a placeholder
    project = next((p for p in projects if p['link'] == f'/projects/{project_id}'), None)
    if project:
        return render_template('project_detail.html', project=project)
    return redirect(url_for('index'))


from google_sheets import send_to_google_sheets
@app.route('/contact', methods=['POST'])
def contact():
    if request.method == 'POST':
        try:
            name = request.form.get('name')
            email = request.form.get('email')
            message = request.form.get('message')
            
            logging.info(f"Received form data - Name: {name}, Email: {email}")
            
            # Send data to Google Sheets
            result = send_to_google_sheets(name, email, message)
            logging.info(f"Google Sheets result: {result}")
            
            # Check if the submission was successful
            if result and result.get("result") == "Success":
                return render_template('thank_you.html', name=name)
            else:
                # Handle error - properly extract the error message
                error_message = result.get("message", result.get("error", "Unknown error"))
                logging.error(f"Error from Google Sheets: {error_message}")
                return render_template('error.html', error=error_message), 500
                
        except Exception as e:
            logging.exception("Unexpected error in contact route")
            return render_template('error.html', error=str(e)), 500
    
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)