/****************************************
 * 计分界面模块
 ****************************************/
var UIScore = Class(Layer,
{
	_lalHiScore: null,			// 最高分
	_lalStage: null,			// 关数
	_lalScroe: null,			// 分数
	_arrLalPTS: null,			// [L PTS R] x 4
	_lalTotalNum: null,			// 总数

	_tickDisp: null,
	_iNumType: 0,
	_iNumAll: 0,



	/**
	 * 构造函数 - 创建计分界面
	 */
	UIScore: function()
	{
		this.Layer();		// super


		this._tickDisp = new Tick(30);


		var lal, spt, lay;

		//
		// HI-SCORE
		//
		lal = new Lable("HI-SCORE");
		lal.Move(130, 32);
		lal.SetSize(170, 30);
		lal.SetColor("#B53120");
		this.Append(lal);

		//
		// 最高分
		//
		this._lalHi = new Lable();
		this._lalHi.Move(305, 32);
		this._lalHi.SetSize(200, 30);
		this._lalHi.SetColor("#EA9E22");
		this.Append(this._lalHi);

		//
		// 计分关数
		//
		this._lalStage = new Lable();
		this._lalStage.Move(0, 64);
		this._lalStage.SetSize(512, 30);
		this._lalStage.SetColor("#FFF");
		this._lalStage.SetAlign("center");
		this.Append(this._lalStage);

		//
		// I-PLAYER
		//
		lal = new Lable("I-PLAYER");
		lal.Move(0, 96);
		lal.SetSize(185, 30);
		lal.SetColor("#B53120");
		lal.SetAlign("right");
		this.Append(lal);

		//
		// 本关得分
		//
		this._lalScroe = new Lable();
		this._lalScroe.Move(0, 128);
		this._lalScroe.SetSize(185, 30);
		this._lalScroe.SetAlign("right");
		this._lalScroe.SetColor("#EA9E22");
		this.Append(this._lalScroe);

		//
		// 得分 PTS 数量
		//
		var top, i, L, R;

		this._arrPTS = [];
		for(i = 0; i < 4; ++i)
		{
			top = 176 + i * 48;

			// PTS
			lal = new Lable();
			lal.Move(130, top);
			lal.SetSize(55, 30);
			lal.SetColor("#FFF");
			lal.SetAlign("right");
			lal.SetText("PTS");

			// 得分
			L = new Lable();
			L.Move(0, top);
			L.SetSize(112, 30);
			L.SetColor("#FFF");
			L.SetAlign("right");

			// 数量
			R = new Lable();
			R.Move(183, top);
			R.SetSize(45, 30);
			R.SetColor("#FFF");
			R.SetAlign("right");


			this.Append(lal);
			this.Append(L);
			this.Append(R);

			this._arrPTS[i] = {L:L, R:R};
		}

		//
		// TOTAL标签
		//
		lal = new Lable();
		lal.Move(0, 368);
		lal.SetSize(185, 30);
		lal.SetColor("#FFF");
		lal.SetAlign("right");
		lal.SetText("TOTAL");
		this.Append(lal);

		//
		// 总数
		//
		this._lalTotal = new Lable();
		this._lalTotal.Move(183, 368);
		this._lalTotal.SetSize(45, 30);
		this._lalTotal.SetColor("#FFF");
		this._lalTotal.SetAlign("right");
		this.Append(this._lalTotal);

		//
		// 坦克列表
		//
		for(i = 0; i < 4; i++)
		{
			spt = new Sprite("res/Misc.png", 32, 32);
			spt.Move(232, 186 + 48 * i);
			spt.SetFrame(3);
			this.Append(spt);

			spt = new Sprite("res/Tank.png", 32, 32);
			spt.Move(250, 176 + 48 * i);
			spt.SetFrame(4 + 2 * i);
			this.Append(spt);
		}

		//
		// 分隔符
		//
		lay = new Layer();
		lay.SetBG("#FFF");
		lay.SetSize(128, 3);
		lay.Move(192, 360);
		this.Append(lay);
	},



	OnEnter: function()
	{
		// 显示计分层
		this.Show();

		// 显示最高分
		this._lalHi.SetText(App.Game.ScoreHi + "");


		//
		// 清空原有显示的数据
		//
		var pts, i;
		for(i = 0; i < 4; ++i)
		{
			pts = this._arrPTS[i];
			pts.L.SetText("");
			pts.R.SetText("");
		}

		this._lalTotal.SetText("");

		this._lalScroe.SetText(App.Game.Score + "");
		this._lalStage.SetText("STAGE  " + App.Game.Stage);

		//
		// 计数器归零
		//
		this._tickDisp.Reset(30);

		this._iNumType = 0;
		this._iNumAll = 0;
	},


	OnLeave: function()
	{
		// 隐藏计分层
		this.Hide();
	},


	OnUpdate: function(T)
	{
		if(T < 4)
		{
			if(!this._tickDisp.On())
				return --T;

			this._tickDisp.Reset(10);

			//
			// 得分 PTS 数量
			//
			var pts = this._arrPTS[T]
			
			pts.L.SetText(this._iNumType * (T + 1) * 100 + "");
			pts.R.SetText(this._iNumType + "");


			if(this._iNumType < App.Game.KillTypeNum[T])
			{
				this._iNumType++;
				this._iNumAll++;
				return --T;
			}
			else
			{
				this._tickDisp.Reset(30);		//显示下一类型时稍加延长时间
				this._iNumType = 0;
			}
		}
		else if(T == 50)
		{
			// 显示总数
			this._lalTotal.SetText(this._iNumAll + "");
		}
		else if(T < 180)
		{
			//
			// 统计完成后停顿会
			//
		}
		else if(T == 180)
		{
			if(App.Game.GameOver)	// 进入结束界面
			{
				return App.MyApp.Go(App.OverUI);
			}
			else					// 进入下一关
			{
				//
				// 通关
				//
				if(++App.Game.Stage > Const.MAX_STAGE)
					App.Game.Stage = 1;

				return App.MyApp.Go(App.GameUI);
			}
		}

		return T;
	}
});