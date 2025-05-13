import whois
from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.domain import Domain, DomainType


class DomainService:
    def __init__(self, db: Session):
        self.db = db

    def get_domain_info(self, domain_name: str) -> Dict:
        """Get WHOIS information for a domain."""
        try:
            domain_info = whois.whois(domain_name)
            return {
                "domain": domain_name,
                "registrar": domain_info.registrar,
                "creation_date": domain_info.creation_date,
                "expiration_date": domain_info.expiration_date,
                "status": domain_info.status,
            }
        except Exception as e:
            return {"error": str(e)}

    def add_domain(
        self, domain_name: str, domain_type: DomainType, user_id: int
    ) -> Domain:
        """Add a new domain to track."""
        domain_info = self.get_domain_info(domain_name)

        domain = Domain(
            name=domain_name,
            type=domain_type,
            user_id=user_id,
            registrar=domain_info.get("registrar"),
            creation_date=domain_info.get("creation_date"),
            expiration_date=domain_info.get("expiration_date"),
            status=domain_info.get("status"),
        )

        self.db.add(domain)
        self.db.commit()
        self.db.refresh(domain)
        return domain

    def get_domains(
        self,
        user_id: int,
        domain_type: Optional[DomainType] = None,
        sort_by: str = "name",
        sort_order: str = "asc",
    ) -> List[Domain]:
        """Get domains for a user with optional filtering and sorting."""
        query = self.db.query(Domain).filter(Domain.user_id == user_id)

        if domain_type:
            query = query.filter(Domain.type == domain_type)

        if sort_by == "name":
            query = query.order_by(
                Domain.name.asc() if sort_order == "asc" else Domain.name.desc()
            )
        elif sort_by == "expiration":
            query = query.order_by(
                Domain.expiration_date.asc()
                if sort_order == "asc"
                else Domain.expiration_date.desc()
            )
        elif sort_by == "registration":
            query = query.order_by(
                Domain.creation_date.asc()
                if sort_order == "asc"
                else Domain.creation_date.desc()
            )

        return query.all()

    def delete_domain(self, domain_id: int, user_id: int) -> bool:
        """Delete a domain from tracking."""
        domain = (
            self.db.query(Domain)
            .filter(Domain.id == domain_id, Domain.user_id == user_id)
            .first()
        )

        if domain:
            self.db.delete(domain)
            self.db.commit()
            return True
        return False

    def update_domain_info(self, domain_id: int, user_id: int) -> Optional[Domain]:
        """Update WHOIS information for a domain."""
        domain = (
            self.db.query(Domain)
            .filter(Domain.id == domain_id, Domain.user_id == user_id)
            .first()
        )

        if domain:
            domain_info = self.get_domain_info(domain.name)
            domain.registrar = domain_info.get("registrar")
            domain.creation_date = domain_info.get("creation_date")
            domain.expiration_date = domain_info.get("expiration_date")
            domain.status = domain_info.get("status")

            self.db.commit()
            self.db.refresh(domain)
            return domain
        return None
