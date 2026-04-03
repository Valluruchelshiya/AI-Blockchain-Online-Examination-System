import json
import hashlib
from web3 import Web3
from flask import current_app
from backend.extensions import db
from backend.models import BlockchainTransaction

def canonical_json(data: dict) -> str:
    return json.dumps(data, sort_keys=True, separators=(",", ":"))

def compute_hash(data: dict) -> str:
    canon = canonical_json(data)
    return hashlib.sha256(canon.encode("utf-8")).hexdigest()

def _get_web3():
    rpc_url = current_app.config["BLOCKCHAIN_RPC_URL"]
    return Web3(Web3.HTTPProvider(rpc_url))

def write_to_blockchain(entity_type: str, entity_id: int, data: dict) -> str:
    """
    Stub: In real setup, call smart contract.
    Here we just compute hash and mimic tx hash.
    """
    hash_value = compute_hash(data)
    fake_tx_hash = "0x" + hash_value[:64]  # placeholder

    tx = BlockchainTransaction(
        entity_type=entity_type,
        entity_id=entity_id,
        hash_value=hash_value,
        blockchain_tx_hash=fake_tx_hash,
        blockchain_ref="LOCAL_SIM"
    )
    db.session.add(tx)
    db.session.commit()
    return fake_tx_hash

def verify_against_blockchain(entity_type: str, entity_id: int, data: dict) -> bool:
    hash_value = compute_hash(data)
    tx = BlockchainTransaction.query.filter_by(
        entity_type=entity_type, entity_id=entity_id
    ).order_by(BlockchainTransaction.id.desc()).first()
    if not tx:
        return False
    return tx.hash_value == hash_value
