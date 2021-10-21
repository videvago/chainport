import React, { Component, createRef } from 'react';
import './App.css';
import Web3 from 'web3';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';

const Networks = [
  {
    chainId: 5,
    name: 'Goerli Testnet',
    internalIndex: 0,
  },
  {
    chainId: 4,
    name: 'Rinkeby Testnet',
    internalIndex: 1,
  },
  {
    chainId: 0xfa2,
    name: 'FTM Testnet',
    internalIndex: 2,
  },
];

const INITIAL_STATE = {
  address: '',
  web3: null,
  provider: null,
  connected: false,
  chainId: 1,
  selIndex: -1,
  tpl: 'ERC20',
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...INITIAL_STATE,
    };

    this.web3Modal = new Web3Modal({
      cacheProvider: true,
      providerOptions: this.getProviderOptions(),
    });

    this.ref1 = createRef();
    this.ref2 = createRef();

    this.onTemplateChange = this.onTemplateChange.bind(this);
  }

  Templates = [
    {
      name: 'ERC20',
      code: (
        <>
          <tr>
            <td>Amount:</td>
            <td>
              <input ref={this.ref1} className="tw-100" type="edit" />
            </td>
          </tr>
          <tr>
            <td>Recipient:</td>
            <td>
              <input ref={this.ref2} className="tw-100" type="edit" />
            </td>
          </tr>
        </>
      ),
    },
    {
      name: 'ERC721',
      code: (
        <>
          <tr>
            <td>TokenID:</td>
            <td>
              <input ref={this.ref1} className="tw-100" type="edit" />
            </td>
          </tr>
          <tr>
            <td>Recipient:</td>
            <td>
              <input ref={this.ref2} className="tw-100" type="edit" />
            </td>
          </tr>
        </>
      ),
    },
    {
      name: 'Custom',
      code: (
        <tr>
          <td>Data:</td>
          <td>
            <input ref={this.ref1} className="tw-100" type="edit" />
          </td>
        </tr>
      ),
    },
  ];

  onTemplateChange(ev) {
    this.setState({ tpl: ev.target.id });
  }

  async componentDidMount() {
    await this.setup();
  }

  async componentWillUnmount() {
    this.resetApp(false);
  }

  subscribeProvider = async (provider) => {
    if (!provider.on) {
      return;
    }

    provider.on('disconnect', () => {
      this.resetApp(false);
    });

    provider.on('accountsChanged', async (accounts) => {
      this.setState({ address: accounts[0] });
    });

    provider.on('chainChanged', async (chainId) => {
      const chainIdInt = parseInt(chainId);
      if (this.state.chainId !== chainIdInt) {
        this._updateNetworkList(chainIdInt);
        this.setState({ chainId: chainIdInt });
        console.log('Network changed: ', chainIdInt);
      }
    });
  };

  getProviderOptions = () => {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: process.env.REACT_APP_INFURA_ID,
        },
      },
    };
    return providerOptions;
  };

  setup = async () => {
    const provider = await this.web3Modal.connect();
    await this.subscribeProvider(provider);

    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
    const address = accounts[0];
    const chainId = await web3.eth.getChainId();

    console.log('Connected: ', chainId);

    this.setState({
      web3,
      provider,
      connected: true,
      address,
      chainId,
      selIndex: -1,
    });
    this._updateNetworkList(chainId);
  };

  resetApp = async (clearCache) => {
    const { provider, web3 } = this.state;
    if (provider) provider.removeAllListeners();
    if (web3 && web3.currentProvider && web3.currentProvider.close) {
      await web3.currentProvider.close();
    }
    if (clearCache) {
      this.web3Modal.clearCachedProvider();
    }
    this.setState({ ...INITIAL_STATE });
  };

  _updateNetworkList(chainId) {
    if (chainId === 4 || chainId === 5 || chainId === 0xfa2) {
      this.networkList = Networks.sort((a, b) =>
        a.chainId === chainId ? -1 : b.chainId === chainId ? 1 : 0
      );
      this.setState({ selIndex: this.networkList[1].internalIndex });
    } else this.networkList = undefined;
  }

  render() {
    const { chainId, selIndex, tpl } = this.state;
    return (
      <div id="App">
        <div id="Content">
          <span className="header">
            <b>CHAINPORT BRIDGE</b>
          </span>
          <hr />
          <table>
            <thead>
              <tr>
                <td>Selected Network:</td>
                <td>
                  {this.networkList
                    ? this.networkList[0].name
                    : `Unsupported (${chainId})`}
                </td>
              </tr>
              <tr>
                <td colSpan="2">
                  <hr />
                </td>
              </tr>
            </thead>
            <tbody>
              {this.networkList &&
                this.networkList
                  .filter((_, index) => index > 0)
                  .map((n, index) => (
                    <tr key={`NET_${index}`}>
                      <td>{index === 0 ? 'Target Network:' : ''}</td>
                      <td>
                        <input
                          className="radio-margin"
                          defaultChecked={selIndex === n.internalIndex}
                          id={n.internalIndex}
                          type="radio"
                          name="destChain"
                          value={n.internalIndex}
                        />
                        <label htmlFor={n.internalIndex}>{n.name}</label>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          <hr />
          <table>
            <tbody>
              <tr>
                <td>Template:</td>
                <td onChange={this.onTemplateChange}>
                  {this.Templates.map((t, idx) => (
                    <span key={`TPL_${t.name}`}>
                      <input
                        className={idx ? '' : 'radio-margin'}
                        name="template"
                        id={t.name}
                        type="radio"
                        defaultChecked={tpl === t.name}
                      />
                      <label htmlFor={t.name}>{t.name}</label>
                    </span>
                  ))}
                </td>
              </tr>
              {this.Templates.find((t) => t.name === tpl).code}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default App;
