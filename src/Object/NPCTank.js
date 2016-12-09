/****************************************
 * 电脑坦克类
 ****************************************/
var NPCTank = Class(Tank,
{
	_bonus: false,			// 是否带奖励
	_HP: 0,					// 生命值

	_tickRed: null,			// 奖励闪烁计时器
	_statRed: null,
	_tickFlash: null,
	_tickScore: null,		// 奖励加分计时器




	NPCTank: function()
	{
		this.Tank(1);	// super


		this._tickRed = new Tick(10);
		this._statRed = new Tick(2);

		this._tickScore = new Tick(10);
		this._tickFlash = new Tick(2);

		this._tickBirth = new Tick(5);
	},


	/**
	 * 覆盖 -- 界面更新
	 */
	_UpdateUI: function()
	{
		//
		// 更新带奖励的NPC颜色
		//
		if(this._bonus)
		{
			if(this._tickRed.On())
			{
				this._statRed.On()? --this._icon : ++this._icon;
				this._UpdateFrame();
			}

			return;
		}

		//
		// 加强型坦克颜色
		//
		if(this._type == 3)
		{
			switch(this._HP)
			{
			case 1:		//白
				this._icon = 10;
				break;
			case 2:		//黄-绿
				this._icon = this._tickFlash.On()? 13 : 12;
				break;
			case 3:		//黄-白
				this._icon = this._tickFlash.On()? 13 : 10;
				break;
			case 4:		//绿-白
				this._icon = this._tickFlash.On()? 12 : 10;
				break;
			}
		}

		this._UpdateFrame();
	},


	/**
	 * 覆盖 -- 设置类型
	 */
	_SetType: function(t)
	{
		this.Speed = 1;

		switch(t)
		{
		case 0:		// 普通型
			this._icon = 4;
			this._HP = 1;
			this._SetBullets(1, 2, false);
			break;

		case 1:		// 灵活型
			this._icon = 6;
			this.Speed = 2;
			this._HP = 1;
			this._SetBullets(1, 2, false);
			break;

		case 2:		// 威力型
			this._icon = 8;
			this._HP = 1;
			this._SetBullets(1, 3, false);
			break;

		case 3:		// 加强型
			this._icon = 10;
			this._HP = 4;
			this._SetBullets(1, 2, false);
			break;
		}
	},


	/**
	 * 覆盖 -- 坦克被击中
	 */
	_Hit: function(force)
	{
		//
		// 接到炸弹强制爆炸
		//   如果带奖励则丢失
		//
		if(force)
		{
			this._HP = -1;
			this._bonus = false;

			this._sptTank.Hide();
			return HitState.HIT;
		}

		//
		// 显示奖励
		//
		if(this._bonus)
		{
			this._bonus = false;
			App.Scene.Bonus.Show();
		}

		if(--this._HP == 0)
		{
			//
			// 加分（100,200,300,400）
			//
			App.Game.SocreAdd(100 * (this._type + 1));

			//
			// 显示得分（分数图标位于草的上层）
			//
			this._sptTank.SetFrame(Const.FR_SCORE + this._type);
			this._sptTank.SetZ(Const.Z_SCORE);

			return HitState.HIT;
		}

		return HitState.NONE;
	},


	/**
	 * 覆盖 -- 坦克爆炸
	 */
	_Boom: function()
	{
		//
		// 被炸掉的不显示分数，也不类型计数
		//
		if(this._HP == -1)
		{
			this._state = TankState.RESET;
			App.Game.KillEnemy(-1);
		}
		else
		{
			this._state = TankState.SCORE;
			App.Game.KillEnemy(this._type);
		}
	},


	/**
	 * 覆盖 -- 坦克重置
	 */
	_Reset: function()
	{
		// 撤销奖励
		this._bonus = false;

		this._tickRed.Reset();
		this._tickScore.Reset();
	},


	/**
	 * 设置是否带奖励
	 */
	HasBonus: function()
	{
		this._bonus = true;
		this._statRed.Reset();
	}
});