const HandshakePattern = require('./HandshakePattern');

class FallbackPatternModifier {
  VALID_FIRST_MESSAGES = [['e'], ['s'], ['e', 's']];

  constructor() {
    this.name = 'fallback';
    this._name = 'fallback';
  }

  _is_modifiable(handsakepattern) {
    const str = handsakepattern.message_patterns[0].join('');
    for (let i = 0; i < this.VALID_FIRST_MESSAGES.length; i++) {
      const element = this.VALID_FIRST_MESSAGES[i].join('');
      if (element === str) return true;
    }
    return false;
  }

  _get_message_patterns(handshakepattern) {
    return handshakepattern.message_patterns.slice(1);
  }

  _get_initiator_pre_messages(handshakepattern) {
    return handshakepattern.message_patterns[0];
  }

  _get_responder_pre_messages() {}

  _interpret_as_bob(handshakepattern) {
    return true;
  }

  modify(pattern) {
    if (!this._is_modifiable(pattern)) {
      throw new Error(`pattern ${pattern.name} is not modifiable by ${this.name}`);
    }
    const name = pattern.origin_name + pattern.modifiers.concat(this.name).join('+');
    return new HandshakePattern(
      name,
      this._get_message_patterns(pattern),
      this._get_initiator_pre_messages(pattern),
      this._get_responder_pre_messages(pattern),
      this._interpret_as_bob(pattern)
    );
  }
}
module.exports = FallbackPatternModifier;
