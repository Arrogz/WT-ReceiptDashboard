from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import UUID, Column, func
from data import receipts
from datetime import date, datetime
import uuid
from enum import Enum

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
#CORS(app, resources={r"/*": {"origins": "https://yourfrontend.com"}})

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///receipts.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

class ReceiptStatus(Enum):
    PENDING = "Pending"
    FLAGGED = "Flagged"
    APPROVED = "Approved"
    REJECTED = "Rejected"

class Receipt(db.Model):
    id = Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor = db.Column(db.String, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String, nullable=False, default=ReceiptStatus.PENDING.value)
    record_date = db.Column(db.Date, nullable=False, default=date.today)
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


def apply_filters_and_sort(query):
    status = request.args.getlist("status")
    vendor = request.args.getlist("vendor")
    sort_by = request.args.get("sort")
    order = request.args.get("order", default="asc")

    if status:
        lowered_status = [s.lower() for s in status]
        query = query.filter(db.func.lower(Receipt.status).in_(lowered_status))
    if vendor:
        lowered_vendors = [v.lower() for v in vendor]
        query = query.filter(db.func.lower(Receipt.vendor).in_(lowered_vendors))

    result = [r.to_dict() for r in query.all()]

    if sort_by and result and sort_by in result[0]:
        result = sorted(result, key=lambda r: r[sort_by], reverse=(order == "desc"))

    return result, status, vendor, sort_by, order


@app.route("/")
def index():
    result, status, vendor, sort_by, order = apply_filters_and_sort(Receipt.query)
    return render_template("app.html", receipts=result, status=status, vendor=vendor, sort_by=sort_by, order=order)


@app.route("/vendors", methods=["GET"])
def get_vendor():
    vendors = sorted({r.vendor for r in Receipt.query.all()})
    return jsonify(vendors)


@app.route("/receipts", methods=["GET"])
def get_receipts():
    result, _, _, _, _ = apply_filters_and_sort(Receipt.query)
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
        status=data.get("status", ReceiptStatus.PENDING.value),
        record_date= datetime.strptime(data.get("record_date"), "%Y-%m-%d").date() if data.get("record_date") else None,
        confidence=data.get("confidence"),
    )
    db.session.add(receipt)
    db.session.commit()
    return jsonify(receipt.to_dict()), 201

@app.route("/receipts/<receipt_id>", methods=["PATCH"])
def update_status(receipt_id):
    new_status = request.get_json().get("status")
    receipt = db.session.get(Receipt, receipt_id)

    if not receipt:
        return jsonify({"error": "Receipt not found"}), 404

    receipt.status = new_status
    db.session.commit()
    return jsonify(receipt.to_dict())

@app.route("/receipts/<receipt_id>", methods=["DELETE"])
def delete_receipt(receipt_id):
    receipt = db.session.get(Receipt, receipt_id)

    if not receipt:
        return jsonify({"error": "Receipt not found"}), 404

    db.session.delete(receipt)
    db.session.commit()
    return "", 204


# with app.app_context():
#     db.create_all()

#     if db.session.scalar(db.select(func.count()).select_from(Receipt)) == 0:
#         for r in receipts:
#             db.session.add(Receipt(
#                 vendor=r.get("vendor"),
#                 amount=r.get("amount"),
#                 status=r.get("status", "Pending"),
#                 record_date = datetime.strptime(r.get("record_date"), '%Y-%m-%d').date(),
#                 confidence=r.get("confidence"),
#             ))
#         db.session.commit()

if __name__ == "__main__":
    app.run(port=5000, debug=True)