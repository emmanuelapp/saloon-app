(function(){
  'use strict';
  angular.module('app')
    .directive('feedbackBox', feedbackBox);

  function feedbackBox(EventSrv, EventUtils){
    var directive = {
      restrict: 'E',
      templateUrl: 'js/components/feedbackBox.html',
      scope: {
        userData: '=userData',
        elt: '=elt'
      },
      link: link
    };
    return directive;

    function link(scope, element, attrs){
      if(!scope.elt){ console.error('Directive feedback-box need a "elt" argument ! (session or exponent)'); return; }
      if(!scope.userData){ console.error('Directive feedback-box need a "userData" argument !'); return; }
      var vm = {};
      scope.vm = vm;

      vm.elt = scope.elt;
      vm.newCommentSaving = false;
      vm.editCommentSaving = false;
      vm.commentEdited = undefined;

      vm.getComments = function(elt){ return EventUtils.getComments(scope.userData, elt); };
      vm.createComment = createComment;
      vm.toggleEditComment = toggleEditComment;
      vm.updateComment = updateComment;
      vm.deleteComment = deleteComment;

      function createComment(elt, newText){
        if(!vm.newCommentSaving && newText){
          vm.newCommentSaving = true;
          EventSrv.createCommentSession(elt, newText).then(function(commentData){
            EventUtils.addComment(scope.userData, commentData);
            vm.newCommentSaving = false;
            vm.newText = '';
          }, function(){
            vm.newCommentSaving = false;
          });
        }
      }
      function toggleEditComment(comment){
        if(vm.commentEdited === comment){
          vm.commentEdited = undefined;
          vm.editText = undefined;
        } else {
          vm.commentEdited = comment;
          vm.editText = comment.action.text;
        }
      }
      function updateComment(comment, editText){
        if(!vm.editCommentSaving && editText && editText !== comment.action.text){
          vm.editCommentSaving = true;
          EventSrv.editCommentSession(comment, editText).then(function(commentData){
            EventUtils.updateComment(scope.userData, commentData);
            vm.editCommentSaving = false;
            vm.commentEdited = undefined;
            vm.editText = undefined;
          }, function(){
            vm.editCommentSaving = false;
          });
        }
      }
      function deleteComment(comment){
        if(!vm.editCommentSaving){
          vm.editCommentSaving = true;
          EventSrv.deleteCommentSession(comment).then(function(){
            EventUtils.removeComment(scope.userData, comment);
            vm.editCommentSaving = false;
            vm.commentEdited = undefined;
            vm.editText = undefined;
          }, function(){
            vm.editCommentSaving = false;
          });
        }
      }
    }
  }
})();
