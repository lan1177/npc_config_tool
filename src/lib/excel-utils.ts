import * as XLSX from 'xlsx';

export interface NPC {
  id: string;
  编号: string;
  名称: string;
  造型: string;
  门派: string;
  备注: string;
  过期时间: string;
  气血斜率: string;
  气血基数: string;
  难度: string;
  受击增伤: string;
  魔法值基数: string;
  速度斜率: string;
  速度基数: string;
  智能速度配置: string;
  技能: string;
  行为树编号: string;
  使用等级类型: string;
  进入战斗喊话: string;
  所属战斗: string[];
  isModified?: boolean;
}

export interface Battle {
  id: string;
  name: string;
  slots: (string | null)[];
}

export interface ProjectData {
  activityName: string;
  activityId: string;
  npcs: NPC[];
  battles: Battle[];
}

export const handleExcelImport = async (file: File): Promise<ProjectData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        // 自动识别第一个sheet为NPC表
        const npcSheet = workbook.Sheets['NPC'] || workbook.Sheets[workbook.SheetNames[0]];
        if (!npcSheet) throw new Error('未找到NPC数据表，请检查Sheet名称是否为"NPC"或第一个Sheet为NPC数据');
        const npcsRaw = XLSX.utils.sheet_to_json<any>(npcSheet);
        const npcs: NPC[] = npcsRaw.map((row, idx) => ({
          id: row["编号"] || row["npc编号"] || `npc_${Date.now()}_${idx}`,
          编号: row["编号"] || row["npc编号"] || "",
          名称: row["名称"] || "",
          造型: row["造型"] || "",
          门派: row["门派"] || "",
          备注: row["备注"] || "",
          过期时间: row["过期时间"] || "",
          气血斜率: row["气血斜率"] || "",
          气血基数: row["气血基数"] || "",
          难度: row["难度"] || "",
          受击增伤: row["受击增伤"] || "",
          魔法值基数: row["魔法值基数"] || "",
          速度斜率: row["速度斜率"] || "",
          速度基数: row["速度基数"] || "",
          智能速度配置: row["智能速度配置"] || row["智能配置速度"] || "",
          技能: row["技能"] || "",
          行为树编号: row["行为树编号"] || "",
          使用等级类型: row["使用等级类型"] || "",
          进入战斗喊话: row["进入战斗喊话"] || "",
          所属战斗: row["所属战斗"] ? String(row["所属战斗"]).split(",") : [],
          isModified: false,
        }));
        // 战斗表可选
        let battles: Battle[] = [];
        if (workbook.Sheets['战斗']) {
          battles = XLSX.utils.sheet_to_json<Battle>(workbook.Sheets['战斗']);
        }
        // 项目信息可选
        let activityName = '';
        let activityId = '';
        if (workbook.Sheets['项目信息']) {
          const projectSheet = XLSX.utils.sheet_to_json<any>(workbook.Sheets['项目信息'])[0];
          activityName = projectSheet?.activityName || '';
          activityId = projectSheet?.activityId || '';
        }
        resolve({
          activityName,
          activityId,
          npcs,
          battles
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const handleExcelExport = (data: ProjectData): void => {
  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  
  // 创建 NPC 表
  const npcSheet = XLSX.utils.json_to_sheet(data.npcs);
  XLSX.utils.book_append_sheet(workbook, npcSheet, 'NPC');
  
  // 创建战斗表
  const battleSheet = XLSX.utils.json_to_sheet(data.battles);
  XLSX.utils.book_append_sheet(workbook, battleSheet, '战斗');
  
  // 创建项目信息表
  const projectInfo = [{
    activityName: data.activityName,
    activityId: data.activityId
  }];
  const projectSheet = XLSX.utils.json_to_sheet(projectInfo);
  XLSX.utils.book_append_sheet(workbook, projectSheet, '项目信息');
  
  // 导出文件
  XLSX.writeFile(workbook, `${data.activityName}_配置表.xlsx`);
}; 