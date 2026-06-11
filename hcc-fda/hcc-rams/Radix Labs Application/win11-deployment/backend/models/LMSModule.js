"use strict";

// LMSModule Model
class LMSModule {
  constructor({
    id,
    title,
    description,
    content,
    createdAt,
    updatedAt
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.content = content;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }
}
module.exports = LMSModule;