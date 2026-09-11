from flask import Flask, jsonify, request
from flask_cors import CORS
from data import receipts

app = Flask(__name__)
CORS(app)  # allows your React dev server (different port) to call this API


@app.route("/receipts")
def get_receipts():
    status = request.args.get("status")  

    if status:
        filtered = [r for r in receipts if r["status"].lower() == status.lower()]
        return jsonify(filtered)

    return jsonify(receipts)


@app.route("/receipts/<receipt_id>", methods=["PATCH"])
def update_status(receipt_id):
    new_status = request.get_json().get("status")

    for r in receipts:
        if r["id"] == receipt_id:
            r["status"] = new_status
            return jsonify(r)

    return jsonify({"error": "Receipt not found"}), 404


if __name__ == "__main__":
    app.run(port=5000, debug=True)