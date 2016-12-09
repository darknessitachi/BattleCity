/****************************************
 * 游戏界面模块
 ****************************************/
var UIGame = Class(Layer,
{
	EnemyFlag: null,			// 电脑坦克标记

	LableLife: null,			// 生命数标签
	LableStg: null,				// 关数标签

	_lalStage: null,			// 银幕上的关数层

	_arrMask: null,
	_layInfo: null,				// 右侧信息栏

	_lalGameOver: null,			// 游戏结束升起的字
	_timerOver: 0,

	//_oSound: null,


	/**
	 * 构造函数 - 创建游戏界面
	 */
	UIGame: function()
	{
		this.Layer();		// super


		this._tickWater = new Tick(60);
		this._statWater = new Tick(2);
		this._tickStgClr = new Tick(200);

		//this._oSound = new Sound("res/Open.mid");


		var spt, lal, lay;
		var i;

		//
		// 右边信息栏
		//
		this._layInfo = new Layer();
		this._layInfo.Move(452, 0);
		this._layInfo.SetSize(64, 448);

		this.Append(this._layInfo);

		//
		// 创建敌人数标志
		//
		this.EnemyFlag = [];
		for(i = 0; i < 20; ++i)
		{
			spt = this.EnemyFlag[i] = new Sprite("res/Misc.png", 16, 16);
			spt.SetFrame(10);
			spt.Move(18 + 16 * (i%2), 34 + 16 * (i >> 1));

			this._layInfo.Append(spt);
		}

		//
		// "1P"文字
		//
		lal = new Lable();
		lal.SetText("I P");
		lal.Move(14, 252);
		this._layInfo.Append(lal);

		//
		// 生命图标
		//
		spt = new Sprite("res/Misc.png", 16, 16);
		spt.SetFrame(11);
		spt.Move(14, 280);
		this._layInfo.Append(spt);

		//
		// 生命数-标签
		//
		this.LableLife = new Lable();
		this.LableLife.SetText("2");
		this.LableLife.Move(32, 272);
		this._layInfo.Append(this.LableLife);

		//
		// 旗帜图标
		//
		spt = new Sprite("res/Misc.png", 32, 32);
		spt.SetFrame(4);
		spt.Move(14, 352);
		this._layInfo.Append(spt);

		//
		// 关数-标签
		//
		this.LableStg = new Lable();
		this.LableStg.SetAlign("right");
		this.LableStg.SetSize(48, 30);
		this.LableStg.Move(0, 380);
		this._layInfo.Append(this.LableStg);



		//
		// 开幕层
		//
		this._arrMask = [];

		for(i = 0; i < 2; ++i)
		{
			lay = this._arrMask[i] = new Layer();
			lay.SetSize(512, 224);
			lay.SetBG("#666");
			lay.SetZ(Const.Z_UI);

			this.Append(lay);
		}

		//
		// 选关文字
		//
		this._lalStage = new Lable();
		this._lalStage.SetSize(512, 25);
		this._lalStage.SetY(210);
		this._lalStage.SetZ(Const.Z_UI);
		this._lalStage.SetAlign("center");

		this.Append(this._lalStage);


		//
		// "GAME OVER"文字
		//
		this._lalGameOver = new Lable("GAME\nOVER");
		this._lalGameOver.Move(212, 448);
		this._lalGameOver.SetColor("#B53120");
		this._lalGameOver.SetZ(Const.Z_UI);
		this._lalStage.SetAlign("center");
		this._lalGameOver.Hide();

		this.Append(this._lalGameOver);
	},


	OnEnter: function()
	{
		// 显示-游戏界面
		this.Show();

		this._arrMask[0].Move(0, -240);
		this._arrMask[1].Move(0, 464);

		//
		// 第一次开始隐藏信息栏
		//
		if(App.Game.FirstStart)
			this._layInfo.Hide();
	},


	OnLeave: function()
	{
		// 隐藏-游戏界面
		this.Hide();

		//
		// 复位相关对象
		//
		this._timerOver = 0;

		// 清空场景内对象
		App.Scene.ClearTank();
	},


	OnUpdate: function(T)
	{
		//
		// 主流程
		//
		if(T > 101)
		{
			var pass = App.Game.Update();

			if(pass)
				return App.MyApp.Go(App.ScoreUI);

			if(!App.Game.GameOver)
			{
				App.Game.Command();
				return T;
			}

			/*
			 * Game Over流程
			 *
			 * 触发条件：
			 *	 1.总部被打 -更新显示爆炸效果
			 *	 2.命没了
			 *
			 * 在Game Over的过程中，
			 *   玩家无法控制，但NPC仍然继续.
			 *
			 * 游戏结束也有可能发生在过关倒计时中，
			 *   这时无需升起Game Over文字。
			 */
			if(++this._timerOver <= 30)
			{
				//
				// 总部被打掉玩家仍可以控制一小会
				//
				App.Game.Command();
			}
			else if(this._timerOver <= 156)
			{
				//
				// 升起Game Over
				//
				if(!App.Game.StgClr)
				{
					this._lalGameOver.Show();
					this._lalGameOver.SetY(508 - this._timerOver*2);
				}
			}
			else if(this._timerOver <= 300)
			{
				// 进入记分前等待
			}
			else
			{
				this._lalGameOver.Hide();

				// 进入计分流程
				return App.MyApp.Go(App.ScoreUI);
			}

			return T;
		}




		//
		// 界面流程
		//
		if(T < 20)
		{
			this._arrMask[0].MoveBy(0, +12);	// 银幕合拢
			this._arrMask[1].MoveBy(0, -12);
		}
		else if(T == 20)
		{
			this.SetBG("#666");					// 当前关数界面
			this._lalStage.Show();
		}
		else if(T == 21)
		{
			this._lalStage.SetText("STAGE" + Misc.StrN(App.Game.Stage, 5));

			//
			// 第一次开始，停住选关
			//
			if(!App.Game.FirstStart)
				return T;

			--T;

			switch(true)
			{
			//
			// 加关数 (按住GAME_A或GAME_A键)
			//
			case Input.IsPressed(InputAction.GAME_A):
			case Input.IsPressed(InputAction.GAME_C):
				if(App.Game.Stage < Const.MAX_STAGE)
				{
					App.Game.Stage++;
				}
				break;

			//
			// 减关数 (按住GAME_B或GAME_D键)
			//
			case Input.IsPressed(InputAction.GAME_B):
			case Input.IsPressed(InputAction.GAME_D):
				if(App.Game.Stage > 1)
				{
					--App.Game.Stage;
				}
				break;

			//
			// 开始 (START键)
			//
			case Input.IsPressed(InputAction.START):
				++T;
				break;
			}
		}
		else if(T == 22)
		{
			//
			// 恢复显示敌人标志
			//
			for(var i = 0; i < 20; ++i)
				this.EnemyFlag[i].Show();

			App.Game.FirstStart = false;
			App.Game.NewStage();			// 创建新关
		}
		else if(T < 80)
		{
			// 稍作停顿
		}
		else if(T == 80)
		{
			this._lalStage.Hide();				// 隐藏 -关数界面
			this._layInfo.Hide();				// 暂时隐藏信息栏
		}
		else if(T <= 100)
		{
			this._arrMask[0].MoveBy(0, -12);	// 银幕拉开
			this._arrMask[1].MoveBy(0, +12);
		}
		else if(T == 101)
		{
			this._layInfo.Show();				// 显示 -信息栏
			//this._oSound.Play();
		}

		return T;
	}
});