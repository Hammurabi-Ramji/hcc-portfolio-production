'use strict';

class SUENativeBridge {
  constructor(hostName = 'com.hammurabi.sue.nativehost') {
    this.hostName = hostName;
    this.port = null;
    this.connected = false;
    this.pending = new Map();
    this.lastDisconnectError = null;
  }

  connect() {
    try {
      this.port = chrome.runtime.connectNative(this.hostName);
      this.connected = true;

      this.port.onMessage.addListener((message) => this._onMessage(message));
      this.port.onDisconnect.addListener(() => {
        const disconnectError = chrome.runtime.lastError?.message || null;
        this.lastDisconnectError = disconnectError;
        this.connected = false;
        this.port = null;
        this._rejectAllPending(disconnectError || 'Native host disconnected');
      });

      return true;
    } catch {
      this.connected = false;
      this.port = null;
      return false;
    }
  }

  async sendCommand(command) {
    if (!this.connected && !this.connect()) {
      throw new Error('Native host is not connected');
    }

    const id = `native_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const message = { id, ...command };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('Native command timeout'));
      }, 20_000);

      this.pending.set(id, {
        resolve,
        reject,
        timeout,
      });

      try {
        this.port.postMessage(message);
      } catch (error) {
        clearTimeout(timeout);
        this.pending.delete(id);
        reject(new Error(String(error?.message || error)));
      }
    });
  }

  _onMessage(message) {
    const id = message?.id;
    if (!id || !this.pending.has(id)) return;

    const handler = this.pending.get(id);
    this.pending.delete(id);
    clearTimeout(handler.timeout);

    if (message.error) {
      handler.reject(new Error(String(message.error)));
      return;
    }

    handler.resolve(message.payload ?? message);
  }

  _rejectAllPending(reason) {
    for (const [id, handler] of this.pending.entries()) {
      clearTimeout(handler.timeout);
      handler.reject(new Error(reason));
      this.pending.delete(id);
    }
  }
}

globalThis.SUENativeBridge = SUENativeBridge;
