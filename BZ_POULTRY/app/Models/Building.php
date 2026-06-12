<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Building extends Model
{
    protected $fillable = ['name'];

    public static function orderedList()
    {
        return static::query()->orderBy('name')->get();
    }

    public function eggProductions(): HasMany
    {
        return $this->hasMany(EggProduction::class);
    }
}
