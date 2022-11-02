const IqProtocolEntity = require('./IqProtocolEntity');

class ResultIqProtocolEntity extends IqProtocolEntity {
  /**
   * <iq type="result" id="{{id}}" from="{{FROM}}">
    </iq>
   */
  constructor(xmlns = null, _id = null, to = null, _from = null) {
    super(xmlns, _id, 'result', to, _from);
  }
}

module.exports = ResultIqProtocolEntity;
