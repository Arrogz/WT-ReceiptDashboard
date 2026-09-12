from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import UUID, Column
from werkzeug.exceptions import InternalServerError, abort
from data import receipts
from datetime import date, datetime
import uuid

app = Flask(__name__)
CORS(app)  # allows your React dev server (different port) to call this API

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///receipts.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

app.config['DEBUG'] = False 

@app.errorhandler(InternalServerError)
def handle_error(error):
    return "<h1>403 Forbidden</h1><p>You do not have access to this page.</p>"

class Receipt(db.Model):
    id = Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor = db.Column(db.String, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String, nullable=False, default="Pending")
    record_date = db.Column(db.Date, nullable=True, default=date.today)
    confidence = db.Column(db.Float, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "vendor": self.vendor,
            "amount": self.amount,
            "status": self.status,
            "confidence": self.confidence,
            "record_date": self.record_date,
        }
        
@app.route("/")
def index():
    status = request.args.getlist("status")
    vendor = request.args.getlist("vendor")
    sort_by = request.args.get("sort")
    order = request.args.get("order", default="asc")
    
    query = Receipt.query
    if status:
        lowered_status = [s.lower() for s in status]
        query = query.filter(db.func.lower(Receipt.status).in_(lowered_status))
    if vendor:
        lowered_vendors = [v.lower() for v in vendor]
        query = query.filter(db.func.lower(Receipt.vendor).in_(lowered_vendors))
        
    all_receipts = query.all()
    result = [r.to_dict() for r in all_receipts]

    if sort_by and result and sort_by in result[0]:
        result = sorted(result, key=lambda r: r[sort_by], reverse=(order == "desc"))

    return render_template("app.html", receipts=result, status=status, vendor=vendor, sort_by=sort_by, order=order)

@app.route("/vendors", methods = ["GET"])
def get_vendor():
    receipts = Receipt.query.all()
    vendors = sorted({r.vendor for r in receipts})
    return jsonify(vendors)

@app.route("/receipts", methods =["GET"])
def get_receipts():
    status = request.args.get("status")  
    sort_by = request.args.get("sort")
    order = request.args.get('order', default='asc')
    
    query = Receipt.query
    if status:
        query = query.filter(db.func.lower(Receipt.status) == status.lower())

    receipts = query.all()
    result = [r.to_dict() for r in receipts]

    if sort_by and result and sort_by in result[0]:
        result = sorted(result, key=lambda r: r[sort_by], reverse=(order == "desc"))
    
    return jsonify(result)


@app.route("/receipts/", methods=["POST"])
def create_receipt():
    data = request.get_json()
    if not isinstance(data, dict):
        app.logger.info(type(data))
        return jsonify({"error": "Request body must be a JSON object"}), 400
    
    receipt = Receipt(
        vendor=data.get("vendor"),
        amount=data.get("amount"),
        status=data.get("status", "Pending"),
        record_date= datetime.strptime(data.get("record_date"), "%Y-%m-%d").date() if data.get("record_date") else None,
        confidence=data.get("confidence"),
    )
    db.session.add(receipt)
    db.session.commit()
    return jsonify(receipt.to_dict()), 201

@app.route("/receipts/<receipt_id>", methods=["PATCH"])
def update_status(receipt_id):
    new_status = request.get_json().get("status")
    receipt = Receipt.query.get(receipt_id)

    if not receipt:
        return jsonify({"error": "Receipt not found"}), 404

    receipt.status = new_status
    db.session.commit()
    return jsonify(receipt.to_dict())

@app.route("/receipts/<receipt_id>", methods=["DELETE"])
def delete_receipt(receipt_id):
    receipt = Receipt.query.get(receipt_id)

    if not receipt:
        return jsonify({"error": "Receipt not found"}), 404

    db.session.delete(receipt)
    db.session.commit()
    return "", 204


with app.app_context():
    db.create_all()

    if Receipt.query.count() == 0:
        for r in receipts:
            db.session.add(Receipt(
                vendor=r.get("vendor"),
                amount=r.get("amount"),
                status=r.get("status", "Pending"),
                record_date = datetime.strptime(r.get("record_date"), '%Y-%m-%d').date(),
                confidence=r.get("confidence"),
            ))
        db.session.commit()

if __name__ == "__main__":
    app.run(port=5000, debug=True)