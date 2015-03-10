angular.module('app')

.factory('OnboardingSrv', function(LinkedinSrv, Utils){
  'use strict';
  var data = {};
  var service = {
    setProfile: setProfile,
    getProvider: getProvider,
    getSuggestedPseudo: getSuggestedPseudo,
    getSuggestedPurpose: getSuggestedPurpose,
    getEmail: getEmail,
    extendUserWithSocialProfile: extendUserWithSocialProfile,
    getSuggestedInterests: getSuggestedInterests,
    isValidPassword: isValidPassword
  };

  function setProfile(provider, profile){
    data.provider = provider;
    data.profile = profile;
  }

  function getProvider(){
    return data.provider;
  }

  function getSuggestedPseudo(){
    if(data.profile){
      if(data.provider === 'email')               { return data.profile.email.split('@')[0];                 }
      if(data.provider === LinkedinSrv.provider)  { return data.profile.firstName+' '+data.profile.lastName; }
    }
    return 'Anonymous '+Utils.randInt(1, 1000);
  }

  function getSuggestedPurpose(){
    if(data.profile){
      if(data.provider === LinkedinSrv.provider){ return data.profile.headline; }
    }
    return '';
  }

  function getEmail(){
    if(data.profile){
      if(data.provider === 'email')     { return data.profile.email;        }
      if(data.provider === 'linkedin')  { return data.profile.emailAddress; }
    }
    return '';
  }

  function extendUserWithSocialProfile(user){
    if(data.provider === 'linkedin'){
      user.authData = {anonymous: {id: Utils.createUuid()}};
      if(data.profile){
        user[data.provider] = _formatLinkedinProfile(data.profile);
        user.avatar = user[data.provider].avatar;
      }
    }
  }

  function getSuggestedInterests(){
    return angular.copy([
      {name: 'Opportunités professionnelles', interested: false},
      {name: 'Nouveaux produits', interested: false},
      {name: 'Networker', interested: false}
    ]);
  }

  function isValidPassword(password){
    return password && password.length >= 6;
  }

  function _formatLinkedinProfile(profile){
    var res = {};
    if(profile.id)                                { res.id = profile.id;                            }
    if(profile.firstName)                         { res.firstName = profile.firstName;              }
    if(profile.lastName)                          { res.lastName = profile.lastName;                }
    if(profile.emailAddress)                      { res.email = profile.emailAddress;               }
    if(profile.pictureUrl)                        { res.avatar = profile.pictureUrl;                }
    if(profile.headline)                          { res.headline = profile.headline;                }
    if(profile.summary)                           { res.summary = profile.summary;                  }
    if(profile.location && profile.location.name) { res.location = profile.location.name;           }
    if(profile.numConnections)                    { res.connectionsCount = profile.numConnections;  }
    if(profile.publicProfileUrl)                  { res.publicUrl = profile.publicProfileUrl;       }
    if(profile._updated)                          { res._updated = profile._updated;                }
    if(profile.positions){
      res.currentPositions = [];
      for(var i in profile.positions){
        var position = profile.positions[i];
        if(position.isCurrent){
          var pos = {};
          if(position.id)         { pos.id = position.id;                                                                       }
          if(position.title)      { pos.title = position.title;                                                                 }
          if(position.summary)    { pos.summary = position.summary;                                                             }
          if(position.startDate)  { pos.started = new Date(position.startDate.year, position.startDate.month - 1, 1).getTime(); }
          // TODO : format linkedin company object...
          if(position.company)    { pos.company = position.company;                                                             }
          res.currentPositions.push(pos);
        }
      }
    }
    return res;
  }

  return service;
});
