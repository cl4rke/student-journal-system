<?php

class Timeline extends Eloquent
{
	public $fillable = ['timeline', 'start', 'end', 'flag'];

	public function subjects()
	{
		return $this->hasMany('Subject');
	}

	public function schedules()
	{
		return $this->hasManyThrough('Schedule', 'Subject')->orderBy('ordinal');
	}

	public static function current()
	{
		return static::whereFlag(1)->get()->first();
	}

	public function deadlines()
	{
		return $this->hasManyThrough('Deadline', 'Subject')->orderBy('deadline', 'desc');
	}

	public function activities()
	{
		return $this->hasManyThrough('Activity', 'Subject')->with('subject');
	}

	public function questions()
	{
		return $this->hasManyThrough('Question', 'Subject')->with('answers')->with('sabotages');
	}
}