App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  url: 'http://127.0.0.1:7545',
  chairPerson:null,
  currentAccount:null,
  statesName: {
    0: "Init",
    1: "Register",
    2: "Vote",
    3: "Donate",
    4: "Done"
  },
  init: function() {
    $.getJSON('../proposals.json', function(data) {
      var proposalsRow = $('#proposalsRow');
      var proposalTemplate = $('#proposalTemplate');

      for (i = 0; i < data.length; i ++) {
        proposalTemplate.find('.panel-title').text(data[i].name);
        proposalTemplate.find('.panel-link').attr('href', data[i].link);
        proposalTemplate.find('img').attr('src', data[i].picture);
        proposalTemplate.find('img').attr('title', data[i].tooltip);
        proposalTemplate.find('.btn-vote-for').attr('data-id', data[i].for_id);
        proposalTemplate.find('.btn-vote-against').attr('data-id', data[i].against_id);
        proposalTemplate.find('.btn-donate').attr('data-id', data[i].donate_id);
        proposalTemplate.find('.donate-amt').attr('data-id', data[i].donate_amt_id);
        proposalTemplate.find('.register-petition').attr('petitionNumber', data[i].petition_id);
        proposalTemplate.find('.register-petition').attr('petitionScope', data[i].scope);
        proposalTemplate.find('.petition-status').attr('petitionNumber', data[i].petition_id);
        proposalTemplate.find('.petition-status').attr('petitionScope', data[i].scope);
        proposalTemplate.find('.btn-req-donation-amt').attr('petitionNumber', data[i].petition_id);
        proposalTemplate.find('.btn-req-donation-amt').attr('petitionScope', data[i].scope);


        proposalsRow.append(proposalTemplate.html());
        App.names.push(data[i].name);

        // App.handleRaisePetition(data[i].petition_id, data[i].scope);
      }
    });
    return App.initWeb3();
  },

  initWeb3: function() {
        // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);

    ethereum.enable();

    App.populateAddress();
    return App.initContract();
  },

  initContract: function() {
      $.getJSON('Change_Org.json', function(data) {
    // Get the necessary contract artifact file and instantiate it with truffle-contract
    var voteArtifact = data;
    App.contracts.vote = TruffleContract(voteArtifact);

    // Set the provider for our contract
    App.contracts.vote.setProvider(App.web3Provider);
    
    App.getChairperson();
    return App.bindEvents();
  });
    // return App.initPetition();
  },

  // initPetition: function(){
  //   $.getJSON('../proposals.json', function(data) {

  //     for (i = 0; i < data.length; i ++) {
  //       App.handleRaisePetition(data[i].petition_id, data[i].scope);
  //     }

  //   });
  //   return App.bindEvents();
  // },

  bindEvents: function() {
    $(document).on('click', '.btn-vote-for', App.handleVote);
    $(document).on('click', '.btn-vote-against', App.handleVoteAgainst);
    $(document).on('click', '.btn-donate', App.handleDonate);
    $(document).on('click', '#win-count', App.handleWinner);
    $(document).on('click', '#register', function(){ var ad = $('#enter_address').val(); App.handleRegister(ad); });
    $(document).on('click', '#change_state_btn', function(){ var newState = $('#enter_state_opt').val(); App.handleChangeState(newState);});
    $(document).on('click', '.register-petition', App.handleRaisePetition);
    $(document).on('click', '.petition-status', App.handlePetitionStatus);
    $(document).on('click', '#current_state_btn', App.handleCurrentState);
    $(document).on('click', '.btn-req-donation-amt', App.handleRequestDonationAmount);
  },

  populateAddress : function(){
    new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts((err, accounts) => {
      jQuery.each(accounts,function(i){
        if(web3.eth.coinbase != accounts[i]){
          var optionElement = '<option value="'+accounts[i]+'">'+accounts[i]+'</option';
          jQuery('#enter_address').append(optionElement);  
        }
      });
    });
  },

  getChairperson : function(){
    App.contracts.vote.deployed().then(function(instance) {
      return instance;
    }).then(function(result) {
      App.chairPerson = result.constructor.currentProvider.selectedAddress.toString();
      App.currentAccount = web3.eth.coinbase;
      // alert(App.chairPerson);
      // alert(App.currentAccount);
      if(App.chairPerson != App.currentAccount){
        jQuery('#address_div').css('display','none');
        jQuery('#register_div').css('display','none');
      }else{
        jQuery('#address_div').css('display','block');
        jQuery('#register_div').css('display','block');
      }
    });
    // $.getJSON('../proposals.json', function(data) {

    //   for (i = 0; i < data.length; i ++) {
    //     App.handleRaisePetition(data[i].petition_id, data[i].scope);
    //   }

    // });
  },

  handleRegister: function(addr){
    alert("Registering " + addr);
    var voteInstance;
    App.contracts.vote.deployed().then(function(instance) {
      voteInstance = instance;
      // if (addr != App.chairPerson){
      //   alert("Who this No Chairperson telling me what to do!");
      //   // return;
      // }
      var expert = $('#is_expert').val();
      var age = $('#age_id').val();
      var voter_scope = $('#voter_scope_val').val();
      // alert(expert);
      // alert(age);
      // alert(voter_scope);
      // return voteInstance.register(addr);
      // return voteInstance.registerVoter(addr, 0, 30, 0);
      return voteInstance.registerVoter(addr, expert, age, voter_scope);
    }).then(function(result, err){
        if(result){
            if(parseInt(result.receipt.status) == 1)
            alert("Registration done successfully for " + addr)
            else
            alert("Registration of " + addr + " not done successfully due to revert")
        } else {
            alert("Registration of " + addr + " failed")
        }
    });
},

  handleChangeState: function(newState){
    alert("Changing Phase to " + App.statesName[newState]);
    var voteInstance;
    App.contracts.vote.deployed().then(function(instance) {
      voteInstance = instance;
      var addr = $('#enter_address').val();
      // if (addr != App.chairPerson){
      //   alert("Who this No Chairperson telling me what to do!");
      //   // return;
      // }
      return voteInstance.changeState(newState);
    }).then(function(result, err){
        if(result){
            // if(parseInt(result.receipt.status) == 1)
            alert("Phase changed successfully to " + App.statesName[newState])
            // console.log("state change successfull")
            // if(newState == 2){
            //   $("#register").prop( "disabled", true);
            // }
            // else
            // alert(addr + " registration not done successfully due to revert")
        } else {
            // alert(newState + " registration failed")
            alert("Phase change to " + App.statesName[newState] + " unsuccessful")
            // alert(err + " registration failed")
        }   
    });
},

  handleCurrentState: function(event){
    event.preventDefault();
    var voteInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];
      // var account = addr;
      // alert(account + " voting failed")
      App.contracts.vote.deployed().then(function(instance) {
        voteInstance = instance;

        return voteInstance.getCurrentState();
        // return voteInstance.vote(proposalId, 0);
        // return voteInstance.changeState(4);
        // return voteInstance.registerVoter(account, 0, 30, 0);
      }).then(function(result, err){
            if(result){
              alert("Current Phase: " + App.statesName[result]);
            } else {
              alert("Current Phase fetching failed!")
            }
        });
    });
  },

  handleVote: function(event) {
    event.preventDefault();
    var addr = $('#enter_address').val();
    // alert(addr);
    var proposalId = parseInt($(event.target).data('id'));
    // alert(proposalId);
    var voteInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];
      // var account = addr;
      // alert(account + " voting failed")
      App.contracts.vote.deployed().then(function(instance) {
        voteInstance = instance;

        return voteInstance.vote(proposalId, 0, {from: account});
        // return voteInstance.vote(proposalId, 0);
        // return voteInstance.changeState(4);
        // return voteInstance.registerVoter(account, 0, 30, 0);
      }).then(function(result, err){
            if(result){
                console.log(result.receipt.status);
                if(parseInt(result.receipt.status) == 1)
                alert(account + " voting successful")
                else
                alert(account + " voting unsuccessfull due to revert")
            } else {
                alert(account + " voting failed")
            }
        });
    });
  },

  handleVoteAgainst: function(event) {
    event.preventDefault();
    var addr = $('#enter_address').val();
    // alert(addr);
    var proposalId = parseInt($(event.target).data('id'));
    // alert(proposalId);
    var voteInstance;
    proposalId = proposalId % 4;
    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];
      // var account = addr;
      // alert(account + " voting failed")
      App.contracts.vote.deployed().then(function(instance) {
        voteInstance = instance;

        // return voteInstance.vote(proposalId, {from: account});
        return voteInstance.vote(proposalId, 1, {from: account});
        // return voteInstance.changeState(4);
        // return voteInstance.registerVoter(account, 0, 30, 0);
      }).then(function(result, err){
            if(result){
                console.log(result.receipt.status);
                if(parseInt(result.receipt.status) == 1)
                alert(account + " vote against done successfully")
                else
                alert(account + " vote against unsuccessfull due to revert")
            } else {
                alert(account + " vote against failed")
            }
        });
    });
  },

  handleDonate: function(event) {
    event.preventDefault();
    var addr = $('#enter_address').val();
    // alert(addr);
    var proposalId = parseInt($(event.target).data('id'));
    // alert(proposalId);
    var amount = $(".donate-amt[data-id=" + (proposalId+4) +"]").val();
    // console.log(amount);
    var voteInstance;
    proposalId = proposalId % 4;
    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];
      // var account = addr;
      App.contracts.vote.deployed().then(function(instance) {
        voteInstance = instance;

        // return voteInstance.vote(proposalId, {from: account});
        return voteInstance.donate(proposalId, amount, {from: account});
        // return voteInstance.changeState(4);
        // return voteInstance.registerVoter(account, 0, 30, 0);
      }).then(function(result, err){
            if(result){
                console.log(result.receipt.status);
                if(parseInt(result.receipt.status) == 1)
                alert(account + " donation successful")
                else
                alert(account + " donation unsuccessfull due to revert")
            } else {
                alert(account + " donation failed")
            }
        });
    });
  },

  handleRaisePetition: function(event) {
    event.preventDefault();
    // var addr = $('#enter_address').val();
    // alert(addr);
    var petitionNumber = parseInt($(event.target).attr('petitionNumber'));
    var petitionScope = parseInt($(event.target).attr('petitionScope'));
    // alert(proposalId);
    // var amount = $(".donate-amt[data-id=" + (proposalId+4) +"]").val();
    // console.log(amount);
    var voteInstance;
    // alert(petitionNumber);
    // alert(petitionScope);
    // alert(petitionNumber);
    // alert(petitionScope);
    // proposalId = proposalId % 4;
    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];
      // var account = addr;
      App.contracts.vote.deployed().then(function(instance) {
        voteInstance = instance;

        return voteInstance.raisePetition(petitionNumber, petitionScope, {from: account});

      }).then(function(result, err){
            if(result){
                console.log(result.receipt.status);
                if(parseInt(result.receipt.status) == 1)
                alert(petitionScope + " Petition: " + petitionNumber + " raised successfull");
                else
                alert(petitionScope + " Petition: " + petitionNumber + " unsuccessful due to revert");
            } else {
                alert(petitionScope + " Petition: " + petitionNumber + " failed");
            }
        });
    });
  },

  handlePetitionStatus : function(event) {
    // alert();
    event.preventDefault();

    var petitionNumber = parseInt($(event.target).attr('petitionNumber'));
    // var petitionScope = parseInt($(event.target).attr('petitionScope'));
    alert("Status of Petition: " + petitionNumber);
    var voteInstance;
    App.contracts.vote.deployed().then(function(instance) {
      voteInstance = instance;
      return voteInstance.reqPetitionStatus(petitionNumber);
    }).then(function(res){
    console.log(res);
    alert("Petition: " + petitionNumber + " forCount: " + res[0].c[0]);
    alert("Petition: " + petitionNumber + " againstCount: " + res[1].c[0]);
      // alert(App.names[res] + "  is the winner ! :)");
    }).catch(function(err){
      console.log(err);
    })
  },

  handleRequestDonationAmount : function(event) {
    // alert();
    event.preventDefault();

    var petitionNumber = parseInt($(event.target).attr('petitionNumber'));
    // var petitionScope = parseInt($(event.target).attr('petitionScope'));
    // console.log(petitionNumber);
    alert("Fetching Donation Amount of Petition: " + petitionNumber);
    var voteInstance;
    App.contracts.vote.deployed().then(function(instance) {
      voteInstance = instance;
      return voteInstance.reqDonationAmount(petitionNumber);
    }).then(function(res){
    console.log(res);
    alert("Donation Amount of Petition: " + petitionNumber + " is " + res[0].c[0]);
      // alert(App.names[res] + "  is the winner ! :)");
    }).catch(function(err){
      console.log(err);
    })
  },

  handleWinner : function() {
    console.log("To get winner");
    var voteInstance;
    App.contracts.vote.deployed().then(function(instance) {
      voteInstance = instance;
      // return voteInstance.reqPetitionStatus();
    }).then(function(res){
    console.log(res);
    console.log(res[2].c[0]);
      alert(App.names[res] + "  is the winner ! :)");
    }).catch(function(err){
      console.log(err.message);
    })
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
