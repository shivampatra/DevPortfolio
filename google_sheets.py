import requests
import logging

# Send form data to Google Sheets via 
   
def send_to_google_sheets(name, email, message):
    """Send form data to Google Sheets via Apps Script."""
    # Replace with your actual deployed script URL
    url = "https://script.google.com/macros/s/AKfycbyFMBBUYSmiCH8daA5gvuz5uVeERfgcV8wM5YRBxrQ8931cTmoHZMaXDWysDxf2OPbu/exec"

    payload = {
        "name": name,
        "email": email,
        "message": message
    }
    
    try:
        # Set proper headers
        headers = {"Content-Type": "application/json"}
        
        # Send the request
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        # Log the response for debugging
        logging.info(f"Google Sheets API response status: {response.status_code}")
        logging.info(f"Response content: {response.text}")
        
        # Check if there's content
        if response.text:
            try:
                json_response = response.json()
                logging.info(f"Parsed JSON response: {json_response}")
                return json_response
            except ValueError as e:
                logging.error(f"Invalid JSON response: {response.text}")
                logging.error(f"JSON parsing error: {str(e)}")
                return {"error": f"Invalid response format: {str(e)}", "result": "Failed"}
        else:
            logging.error("Empty response received")
            return {"error": "Empty response", "result": "Failed"}
            
    except requests.exceptions.RequestException as e:
        logging.error(f"Error logging to Google Sheets: {e}")
        return {"error": str(e), "result": "Failed"}