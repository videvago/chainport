import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Web3 from "web3";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import {
  getChainData
} from "./utilities/chains";


interface IAppState {
  fetching: boolean;
  address: string;
  web3: any;
  provider: any;
  connected: boolean;
  chainId: number;
  networkId: number;
  assets: IAssetData[];
  showModal: boolean;
  pendingRequest: boolean;
  result: any | null;
}

const INITIAL_STATE: IAppState = {
  fetching: false,
  address: "",
  web3: null,
  provider: null,
  connected: false,
  chainId: 1,
  networkId: 1,
  assets: [],
  showModal: false,
  pendingRequest: false,
  result: null
};

class App extends Component {
  web3Modal: Web3Modal;
  state: IAppState;
  
  constructor(props: any) {
    super(props);
    this.state = {
      ...INITIAL_STATE
    };

    this.web3Modal = new Web3Modal({
      network: this.getNetwork(),
      cacheProvider: false,
      providerOptions: this.getProviderOptions()
    });
  }

  async componentDidMount() {
    await this.setup()
  }
  
  subscribeProvider = async (provider: any) => {
    if (!provider.on) {
      return;
    }
    
    provider.on("close", () => {
      this.resetApp()
    });
    
    provider.on("disconnect", () => {
      this.resetApp()
    });
    
    provider.on("accountsChanged", async (accounts: string[]) => {
      await this.setState({ address: accounts[0] });
      //await this.getAccountAssets();
    });
    
    provider.on("chainChanged", async (chainId: number) => {
      const { web3 } = this.state;
      const networkId = await web3.eth.net.getId();
      await this.setState({ chainId, networkId });
      //await this.getAccountAssets();
    });

    provider.on("networkChanged", async (networkId: number) => {
      const { web3 } = this.state;
      const chainId = await web3.eth.chainId();
      await this.setState({ chainId, networkId });
      //await this.getAccountAssets();
    });
  };
  
  getNetwork = () => getChainData(this.state.chainId).network;

  getProviderOptions = () => {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: process.env.REACT_APP_INFURA_ID
        }
      }
    }
    return providerOptions
  }
  
  setup = async () => {
    const provider = await this.web3Modal.connect();
    await this.subscribeProvider(provider);
    
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
    const address = accounts[0];
    const networkId = await web3.eth.net.getId();
    var chainId;
    
    if (typeof web3.eth.chainId === 'function')
      chainId = await web3.eth.chainId();
    else
      chainId = await web3.eth.getChainId();
    
    await this.setState({
      web3,
      provider,
      connected: true,
      address,
      chainId,
      networkId
    });
  }

  resetApp = async () => {
    const { web3 } = this.state;
    if (web3 && web3.currentProvider && web3.currentProvider.close) {
      await web3.currentProvider.close();
    }
    await this.web3Modal.clearCachedProvider();
    this.setState({ ...INITIAL_STATE });
  };
  
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;
