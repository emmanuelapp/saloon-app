angular.module('app')

.factory('IonicSrv', function($ionicLoading){
  'use strict';
  var service = {
    withLoading: withLoading
  };

  function withLoading(promise){
    $ionicLoading.show();
    return promise.then(function(res){
      $ionicLoading.hide();
      return res;
    });
  }

  return service;
})

.factory('EventSrv', function($rootScope, $q, $ionicModal, StorageUtils, ParseUtils, Utils){
  'use strict';
  var storageKey = 'events';
  var eventCrud = ParseUtils.createCrud('Event');
  var speakerCrud = ParseUtils.createCrud('EventSpeaker');
  var activityCrud = ParseUtils.createCrud('EventActivity');
  var service = {
    getEvents: getEvents,
    getEventInfo: getEventInfo,
    getEventSpeakers: getEventSpeakers,
    getEventSpeaker: getEventSpeaker,
    getEventActivities: getEventActivities,
    getEventActivity: getEventActivity,
    getEventUserData: getEventUserData,
    groupBySlot: groupBySlot,
    getActivityValues: getActivityValues,
    addActivityToFav: addActivityToFav,
    removeActivityFromFav: removeActivityFromFav,
    isActivityFav: isActivityFav,
    getActivityFilterModal: getActivityFilterModal,
    buildChooseActivityModal: buildChooseActivityModal
  };

  function getEvents(_fromRemote){
    return StorageUtils.get(storageKey).then(function(data){
      if(data && !_fromRemote){
        return data;
      } else {
        return eventCrud.getAll().then(function(events){
          return StorageUtils.set(storageKey, events).then(function(){
            return events;
          });
        });
      }
    });
  }

  function getEventInfo(eventId, _fromRemote){
    var key = storageKey+'-'+eventId;
    return _getLocalOrRemote(key, function(){
      return eventCrud.findOne({objectId: eventId});
    }, {}, _fromRemote);
  }

  function getEventSpeakers(eventId, _fromRemote){
    var key = storageKey+'-'+eventId+'-speakers';
    return _getLocalOrRemote(key, function(){
      return speakerCrud.find({event: ParseUtils.toPointer('Event', eventId)}, '&limit=1000');
    }, [], _fromRemote);
  }

  function getEventSpeaker(eventId, speakerId){
    return getEventSpeakers(eventId).then(function(speakers){
      return _.find(speakers, {extId: speakerId});
    });
  }

  function getEventActivities(eventId, _fromRemote){
    var key = storageKey+'-'+eventId+'-activities';
    return _getLocalOrRemote(key, function(){
      return activityCrud.find({event: ParseUtils.toPointer('Event', eventId)}, '&limit=1000');
    }, [], _fromRemote);
  }

  function getEventActivity(eventId, activityId){
    return getEventActivities(eventId).then(function(activities){
      return _.find(activities, {extId: activityId});
    });
  }

  function groupBySlot(activities){
    var activitiesBySlot = [];
    _.map(activities, function(activity){
      var slot = activity.from && activity.to ? moment(activity.from).format('ddd H\\hmm')+'-'+moment(activity.to).format('H\\hmm') : 'Non planifié';
      var group = _.find(activitiesBySlot, {name: slot});
      if(!group){
        group = {
          name: slot,
          from: activity.from,
          to: activity.to,
          activities: []
        };
        activitiesBySlot.push(group);
      }
      group.activities.push(activity);
    });
    return _.sortBy(activitiesBySlot, function(a){
      return new Date(a.from).getTime();
    });
  }

  function getActivityValues(activities){
    var values = _valueLists(['format', 'from', 'category', 'room'], activities);
    values.from = _.map(_.sortBy(values.from, function(f){
      return new Date(f).getTime();
    }), function(f){
      return {
        data: f,
        group: f ? moment(f).format('dddd') : 'Non planifié',
        label: f ? moment(f).format('ddd H\\hmm') : 'Non planifié'
      };
    });
    return values;
  }

  function getEventUserData(eventId){
    var key = storageKey+'-'+eventId+'-userData';
    return StorageUtils.get(key).then(function(data){
      return data;
    });
  }

  function _setEventUserData(eventId, userData){
    var key = storageKey+'-'+eventId+'-userData';
    return StorageUtils.set(key, userData).then(function(){
      return userData;
    });
  }

  function addActivityToFav(eventId, activity){
    // TODO : increment activity fav counter (https://parse.com/docs/rest#objects-updating)
    return getEventUserData(eventId).then(function(userData){
      if(!userData){ userData = {}; }
      if(!userData.activityFavs){ userData.activityFavs = []; }
      if(userData.activityFavs.indexOf(activity.objectId) === -1){
        userData.activityFavs.push(activity.objectId);
      }
      return _setEventUserData(eventId, userData);
    });
  }

  function removeActivityFromFav(eventId, activity){
    // TODO : decrement activity fav counter
    return getEventUserData(eventId).then(function(userData){
      if(!userData){ userData = {}; }
      if(!userData.activityFavs){ userData.activityFavs = []; }
      var index = userData.activityFavs.indexOf(activity.objectId);
      if(index > -1){
        userData.activityFavs.splice(index, 1);
      }
      return _setEventUserData(eventId, userData);
    });
  }

  function isActivityFav(userData, activity){
    if(userData && activity && Array.isArray(userData.activityFavs)){
      return userData.activityFavs.indexOf(activity.objectId) > -1;
    }
    return false;
  }

  function getActivityFilterModal($scope){
    return $ionicModal.fromTemplateUrl('views/events/filter-modal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    });
  }

  function buildChooseActivityModal(eventId, activities){
    var modalScope = $rootScope.$new(true);
    modalScope.data = {};
    modalScope.fn = {};
    modalScope.fn.initModal = function(group){
      modalScope.data.group = group;
      modalScope.data.activities = angular.copy(_.filter(activities, function(activity){
        return group.from === activity.from && group.to === activity.to;
      }));
      _.map(modalScope.data.activities, function(activity){
        activity.checked = !!_.find(group.activities, {objectId: activity.objectId});
      });
      modalScope.modal.show();
    };
    modalScope.fn.validActivities = function(){
      _.map(modalScope.data.activities, function(activity){
        if(_.find(modalScope.data.group.activities, {objectId: activity.objectId})){
          if(!activity.checked){
            _.remove(modalScope.data.group.activities, {objectId: activity.objectId});
            removeActivityFromFav(eventId, activity);
          }
        } else {
          if(activity.checked){
            modalScope.data.group.activities.push(activity);
            addActivityToFav(eventId, activity);
          }
        }
      });
      modalScope.modal.hide();
    };

    return $ionicModal.fromTemplateUrl('views/events/choose-activity-modal.html', {
      scope: modalScope,
      animation: 'slide-in-up'
    }).then(function(modal){
      modalScope.modal = modal;
      return modalScope;
    });
  }

  function _getLocalOrRemote(key, getRemote, remoteDefault, _fromRemote){
    return StorageUtils.get(key).then(function(data){
      if(data && !_fromRemote){
        return data;
      } else {
        return getRemote().then(function(remoteData){
          if(remoteData){
            return StorageUtils.set(key, remoteData).then(function(){
              return remoteData;
            });
          } else {
            return remoteDefault;
          }
        });
      }
    });
  }

  function _valueLists(fields, activities){
    var values = {};
    _.map(fields, function(field){
      values[field] = [];
    });
    _.map(activities, function(activity){
      _.map(fields, function(field){
        var value = Utils.getDeep(activity, field);
        if(typeof value === 'string' && values[field].indexOf(value) === -1){
          values[field].push(value);
        }
        if(typeof value === 'object' && !_.find(values[field], value)){
          values[field].push(value);
        }
      });
    });
    return values;
  }

  return service;
});