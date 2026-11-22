from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ScimUser:
    id: str
    user_name: str
    email: str
    active: bool = True
    groups: list[str] = field(default_factory=list)
    meta: dict[str, Any] = field(default_factory=dict)


@dataclass
class ScimGroup:
    id: str
    display_name: str
    members: list[str] = field(default_factory=list)


class ScimDirectory:
    """In-memory SCIM 2.0–shaped directory (Enterprise preview).

    Supports create/get/list/deactivate users and groups — enough to exercise
    provisioning flows before wiring a hosted SCIM endpoint.
    """

    def __init__(self) -> None:
        self._users: dict[str, ScimUser] = {}
        self._groups: dict[str, ScimGroup] = {}

    def create_user(
        self,
        *,
        id: str,
        user_name: str,
        email: str,
        groups: list[str] | None = None,
        meta: dict[str, Any] | None = None,
    ) -> ScimUser:
        user = ScimUser(
            id=id,
            user_name=user_name,
            email=email,
            groups=list(groups or []),
            meta=dict(meta or {}),
        )
        self._users[id] = user
        return user

    def get_user(self, user_id: str) -> ScimUser | None:
        return self._users.get(user_id)

    def list_users(self, *, active_only: bool = False) -> list[ScimUser]:
        users = list(self._users.values())
        if active_only:
            users = [u for u in users if u.active]
        return users

    def deactivate_user(self, user_id: str) -> ScimUser | None:
        user = self._users.get(user_id)
        if user is None:
            return None
        user.active = False
        return user

    def create_group(self, *, id: str, display_name: str, members: list[str] | None = None) -> ScimGroup:
        group = ScimGroup(id=id, display_name=display_name, members=list(members or []))
        self._groups[id] = group
        return group

    def add_member(self, group_id: str, user_id: str) -> ScimGroup | None:
        group = self._groups.get(group_id)
        user = self._users.get(user_id)
        if group is None or user is None:
            return None
        if user_id not in group.members:
            group.members.append(user_id)
        if group_id not in user.groups:
            user.groups.append(group_id)
        return group
