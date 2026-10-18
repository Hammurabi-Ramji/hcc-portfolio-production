"use strict";

// RDSItem Model
class RDSItem {
  constructor({
    id,
    title,
    type,
    content,
    createdAt,
    updatedAt
  }) {
    this.id = id;
    this.title = title;
    this.type = type;
    this.content = content;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }
}
module.exports = RDSItem;