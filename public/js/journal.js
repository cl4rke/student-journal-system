var JournalApp = angular.module('JournalApp', []);

JournalApp.controller('JournalController', ['$scope', '$http', function($scope, $http) {
	
	$scope.subjects = [];
	$scope.newDeadline = {subject_id: 1};
	$scope.quizSubject = 1;
	$scope.quizLesson = '';
	$scope.deadlines = [];
	$scope.questionsQueue = [];
	$scope.type1 = false;
	$scope.type2 = false;
	$scope.type3 = true;
	$scope.combo = 0;
	$scope.highscore = 0;
	$scope.comboColor = "rgb(0, 208, 0)";
	$scope.tab = 'activities';
	$scope.answer_chosen = 1;

	$scope.currDay = new Date().getDate();
	$scope.lastDay = new Date();
	$scope.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	$scope.month = new Date().getMonth();
	$scope.year = new Date().getFullYear();

	$scope.activities = [];
	$scope.activityDays = [];
	$scope.maxActivity = 0;

	$http.get('/quotes').success(function(quotes) {
		$scope.quoteList = $scope.shuffleArray(quotes);
	});

	$http.get('/questions').success(function(questions) {
		$scope.questions = questions;

		if(questions.length > 0)
		{
			var last = questions.slice(-1)[0];

			$scope.quizSubject = last.subject_id;
			$scope.quizLesson = last.lesson;
		}

		$scope.refreshQuestion();
	});
	
	$http.get('/activities').success(function (activities) {
		$scope.activities = activities;

		$scope.longestActivity = 0;

		for (var i = 0; i < activities.length; i++) {
			var found = false;
			for (var i = 0; i < $scope.activityDays.length; i++) {
				if($scope.activityDays[i].day == activities[i].day)
				{
					$scope.activityDays[i].chars += activities[i].activity.length;
					found = true;
					break;
				}
			}
			if( ! found)
				$scope.activityDays.push({day:activities[i].happened_at, chars: activities[i].activity.length});
		};

		for (var i = 0; i < $scope.activityDays.length; i++) {
			if($scope.maxActivity < $scope.activityDays[i].chars)
				$scope.maxActivity = $scope.activityDays[i].chars;
		};
	});

	$scope.getActivityDayColor = function (activityDay) {
		for (var i = 0; i < $scope.activityDays.length; i++) {
			if(activityDay == $scope.activityDays[i].day)
			{
				var intensity = Math.round(255-($scope.activityDays[i].chars * 255 / $scope.maxActivity));
				return 'rgb(255,'+intensity+','+intensity+')';
			}
		}
		return 'rgb(255, 255, 255)';
	}

	$scope.addMonth = function() {
		$scope.month = ($scope.month+1) % 12;
		$scope.setMonths();
		if($scope.currMonth == 'January') $scope.year++;
	}

	$scope.subMonth = function() {
		$scope.month = ($scope.month+11) % 12;
		$scope.setMonths();
		if($scope.currMonth == 'December') $scope.year--;
	}

	$scope.setMonths = function() {
		$scope.prevMonth = $scope.months[($scope.month+11) % 12];
		$scope.currMonth = $scope.months[ $scope.month];
		$scope.nextMonth = $scope.months[($scope.month+1) % 12];
	}

	$scope.setMonths();

	$scope.setDay = function (day) {
		$scope.currDay = day;
	}
	$scope.daysInWeek = function(month, week, year) {
		var firstDate = new Date();

		firstDate.setMonth($scope.month);
		firstDate.setDate(1);
		firstDate.setFullYear($scope.year);

		$scope.lastDay = new Date(new Date($scope.year, ($scope.month+1) % 12, 1)-1).getDate();

		var firstDay = firstDate.getDay();

		var daysInWeek = [];

		for (var i = 0; i < 7; i++) {
			daysInWeek.push((week * 7) + (i - firstDay + 1));
		}

		return daysInWeek;
	}

	$scope.shuffleArray = function(array) {
	    for (var i = array.length - 1; i > 0; i--) {
	        var j = Math.floor(Math.random() * (i + 1));
	        var temp = array[i];
	        array[i] = array[j];
	        array[j] = temp;
	    }
	    return array;
	}

	$scope.popQuizSubmit = function()
	{
		if( ! $scope.question )
			return;

		$scope.correct = true;
		correct = true;

		if($scope.type1)
		{
			if($scope.question.answers.length == 1)		
				for (var i = $scope.question.allAnswers.length - 1; i >= 0; i--) {
					answer = $scope.question.allAnswers[i];

					if(answer.id == $scope.answer_chosen)
						answer.chosen = true;
					else answer.chosen = false;
				}
			
			for (var i = $scope.question.allAnswers.length - 1; i >= 0; i--) {
				answer = $scope.question.allAnswers[i];
				if(answer.correct && answer.chosen)
					answer.judge = "OK";
				else if( ! answer.correct && ! answer.chosen)
					answer.judge = "OK";
				else 
				{
					answer.judge = "X";
					$scope.correct = false;
					correct = false;
				}
			};
		}

		if($scope.type2)
		{
			for (var i = $scope.question.answers.length - 1; i >= 0; i--) {
				answer = $scope.question.answers[i];

				if( ! answer.try || answer.try.toLowerCase() != answer.answer.toLowerCase())
				{
					answer.status = "has-error";
					correct = false;
				}
				else answer.status = "has-success";

				answer.try = answer.answer;
			}
		}

		if(correct)
			$scope.combo++;
		else
		{
			$scope.combo = 0;
			$scope.questionsQueue.push($scope.question);
		}

		if($scope.combo > $scope.highscore)
			$scope.highscore = $scope.combo;

		$scope.refreshComboColor();
	}

	$scope.refreshQuestion = function() 
	{
		if($scope.questionsQueue.length > 0)
			question = $scope.questionsQueue.shift();
		else
		{
			$scope.questionsQueue = $scope.questions.slice(0);

			$scope.questionsQueue = _.filter($scope.questionsQueue, function(question) {
				return (question.question.indexOf($scope.quizLesson) > -1 || 
						question.lesson.indexOf($scope.quizLesson) > -1) &&
						$scope.quizSubject == question.subject_id.toString();
			});

			if($scope.questionsQueue.length == 0)
				$scope.questionsQueue = [{question:'No data matched by criteria', lesson:'', answers:[], sabotages:[], noData: true}];
			
			$scope.questionsQueue = $scope.shuffleArray($scope.questionsQueue);

			question = $scope.questionsQueue.shift();
		}
	
		var max = question.answers.length == 1 ? 4 : question.answers.length * 2;

		for (var i = question.answers.length + question.sabotages.length; i < max; i++) 
		{
			if($scope.questionsQueue[i+1])
			{
				var sabotage = $.extend({}, $scope.questionsQueue[i+1].answers[0]);
				sabotage.correct = 0;
				question.sabotages.push(sabotage);
			}
		}
		question.allAnswers = question.answers.concat(question.sabotages);
		$scope.shuffleArray(question.allAnswers);

		for (var i = 0; i < question.allAnswers.length; i++) {
			question.allAnswers[i].judge = null;
			question.allAnswers[i].try = null;
			question.allAnswers[i].status = null;
			question.allAnswers[i].chosen = null;
		};

		$scope.question = question;
		
		$scope.correct = false;
	}

	$scope.checkAnswer = function (answer) {
		if( ! answer.try || answer.try.toLowerCase() != answer.answer.substring(0, answer.try.length).toLowerCase())
		{
			answer.status = "has-error";
			$scope.combo = 0;
			$scope.refreshComboColor();
			answer.try = answer.answer.substring(0, answer.try.length-1);
		}
		else if(answer.try.length == answer.answer.length)
			answer.status = "has-success";
		else
			answer.status = "";

		correct = true;

		for (var i = $scope.question.answers.length - 1; i >= 0; i--) {
			if($scope.question.answers[i].status != "has-success")
			{
				correct = false;
				break;
			}
		}

		if(correct)
		{
			$scope.combo++;

			if($scope.combo > $scope.highscore)
				$scope.highscore = $scope.combo;
			$scope.refreshQuestion();
			$scope.refreshComboColor();
		}
	}

	function refresh()
	{
		$http.get('subjects').success(function(subjects) {
			$scope.subjects = subjects;
		});

		$http.get('timelines/current/id').success(function(timeline_id) {
			$scope.timeline_id = timeline_id;
		});

		$http.get('deadlines').success(function(deadlines) {
			$scope.deadlines = deadlines;
		});
	}

	refresh();

	$scope.addSubject = function() {
		var subject = ({
			timeline_id: $scope.timeline_id,
			subject: $scope.newSubject
		});
		$scope.newSubject = "";

		$http.post('subjects', subject);
		$scope.subjects.push(subject);

		//refresh();
	}

	$scope.editSubject = function(id) {
		alert($scope.editSubjectText);

		var subject = ({
			subject: $scope.editSubjectText
		});

		$http.post('subjects/'+id+'/edit', subject);

		//refresh();
	}

	$scope.editActivity = function(day, id) {

		var activity = ({
			subject_id : id,
			happened_at : day,
			activity : $scope.edit
		});

		$scope.edit = '';
		$http.post('subjects/'+id+'/activities/'+day, activity);
	}

	$scope.getActivity = function(day, id) {
		$http.get('subjects/'+id+'/activities/'+day).success(function(activity){
			if(activity) $scope.edit = activity;
			else $scope.edit = ' ';
		});
	};

	$scope.addDeadline = function() {
		deadline = 
		{
			subject_id : $scope.newDeadline.subject_id,
			subject: {subject:''},
			caption : $scope.newDeadline.caption,
			deadline : $scope.newDeadline.deadline
		};

		$http.post('deadlines', deadline).success(function(data) {
			deadline.id = data.id;
			deadline.subject_id = data.subject_id;
			deadline.caption = data.caption;
			deadline.deadline = data.deadline;
		});

		$http.get('diffForHumans/'+$scope.newDeadline.deadline).success(function(diffForHumans) {
			deadline.deadline.diffForHumans = diffForHumans;
		});

		for (var i = 0; i < $scope.subjects.length; i++) 
		{
			if($scope.subjects[i].id == deadline.subject_id)
			{
				deadline.subject.subject = $scope.subjects[i].subject;
				break;
			}
		}

		$scope.deadlines.push(deadline);

		$scope.newDeadline.subject = 0;
		$scope.newDeadline.caption = '';
		$scope.newDeadline.deadline = '';
		
	};

	$scope.deleteDeadline = function(id) {
		if(confirm("Are you sure you want to delete?"))
		{
			$http.delete('deadlines/'+id);
			$scope.deadlines = _.filter($scope.deadlines, function(deadline) {
				return deadline.id != id;
			});
		}
	}

	$scope.addChecklist = function(deadline) {
		deadline.checklists.push({});
	}

	$scope.deleteChecklist = function(checklist) {

	}

	$scope.refreshComboColor = function() {
		$scope.comboColor = $scope.getComboColor();
	}

	$scope.getComboColor = function () {
		if($scope.highscore == 0)
			return 'rgb(0, 208, 0)';
		else if($scope.combo == 0)
			return 'rgb(208, 0, 0)';

		green = Math.round(($scope.combo / $scope.highscore) * 208);

		return 'rgb(0,'+green+',0)';
	}
}]);

JournalApp.directive('focusAsap', function($timeout) {
  return {
    link: function(scope, element, attrs) {
      scope.$watch(attrs.focusAsap, function(value) {
        if(value === true) { 
          //$timeout(function() {
            element[0].focus();
            scope[attrs.focusMe] = false;
          //});
        }
      });
    }
  };
});