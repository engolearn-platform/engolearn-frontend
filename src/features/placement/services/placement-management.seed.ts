// Sample questions from the approved Admin mockup. Audio can be attached in the editor.
import type { ManagementState, ManagementQuestion, ManagementAttempt } from "@features/placement/types/placement-management.types";
const sampleQuestions: ManagementQuestion[] = [
  {
    "id": "preview-Q001",
    "code": "Q001",
    "skill": "READING",
    "level": "A1",
    "prompt": "Please turn off the lights ____ you leave the room.",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "before"
      },
      {
        "id": "b",
        "label": "B",
        "text": "because"
      },
      {
        "id": "c",
        "label": "C",
        "text": "during"
      },
      {
        "id": "d",
        "label": "D",
        "text": "between"
      }
    ],
    "correctOptionId": "a",
    "explanation": "Before diễn tả hành động cần làm trước khi rời phòng.",
    "transcript": "",
    "audioUrl": "",
    "status": "ACTIVE"
  },
  {
    "id": "preview-Q002",
    "code": "Q002",
    "skill": "READING",
    "level": "A2",
    "prompt": "Which word has the same meaning as \"postpone\"?",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "delay"
      },
      {
        "id": "b",
        "label": "B",
        "text": "begin"
      },
      {
        "id": "c",
        "label": "C",
        "text": "finish"
      },
      {
        "id": "d",
        "label": "D",
        "text": "cancel"
      }
    ],
    "correctOptionId": "a",
    "explanation": "Postpone có nghĩa là hoãn lại.",
    "transcript": "",
    "audioUrl": "",
    "status": "ACTIVE"
  },
  {
    "id": "preview-Q003",
    "code": "Q003",
    "skill": "READING",
    "level": "B1",
    "prompt": "If I had more free time, I ____ a new language.",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "learn"
      },
      {
        "id": "b",
        "label": "B",
        "text": "will learn"
      },
      {
        "id": "c",
        "label": "C",
        "text": "would learn"
      },
      {
        "id": "d",
        "label": "D",
        "text": "had learned"
      }
    ],
    "correctOptionId": "c",
    "explanation": "Câu điều kiện loại 2: If + quá khứ đơn, would + động từ.",
    "transcript": "",
    "audioUrl": "",
    "status": "ACTIVE"
  },
  {
    "id": "preview-Q004",
    "code": "Q004",
    "skill": "READING",
    "level": "A1",
    "prompt": "My brother ____ in a bank.",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "work"
      },
      {
        "id": "b",
        "label": "B",
        "text": "works"
      },
      {
        "id": "c",
        "label": "C",
        "text": "working"
      },
      {
        "id": "d",
        "label": "D",
        "text": "worked"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Chủ ngữ ngôi thứ ba số ít đi với works.",
    "transcript": "",
    "audioUrl": "",
    "status": "ACTIVE"
  },
  {
    "id": "preview-Q005",
    "code": "Q005",
    "skill": "READING",
    "level": "A2",
    "prompt": "She has been waiting here ____ two hours.",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "since"
      },
      {
        "id": "b",
        "label": "B",
        "text": "for"
      },
      {
        "id": "c",
        "label": "C",
        "text": "from"
      },
      {
        "id": "d",
        "label": "D",
        "text": "during"
      }
    ],
    "correctOptionId": "b",
    "explanation": "For đi với một khoảng thời gian.",
    "transcript": "",
    "audioUrl": "",
    "status": "ACTIVE"
  },
  {
    "id": "preview-Q006",
    "code": "Q006",
    "skill": "READING",
    "level": "B2",
    "prompt": "Neither the manager nor the employees ____ informed.",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "was"
      },
      {
        "id": "b",
        "label": "B",
        "text": "were"
      },
      {
        "id": "c",
        "label": "C",
        "text": "is"
      },
      {
        "id": "d",
        "label": "D",
        "text": "been"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Động từ hòa hợp với danh từ gần nhất: employees.",
    "transcript": "",
    "audioUrl": "",
    "status": "ACTIVE"
  },
  {
    "id": "preview-Q007",
    "code": "Q007",
    "skill": "READING",
    "level": "A2",
    "prompt": "I am looking forward ____ you.",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "to see"
      },
      {
        "id": "b",
        "label": "B",
        "text": "seeing"
      },
      {
        "id": "c",
        "label": "C",
        "text": "to seeing"
      },
      {
        "id": "d",
        "label": "D",
        "text": "see"
      }
    ],
    "correctOptionId": "c",
    "explanation": "Look forward to + V-ing.",
    "transcript": "",
    "audioUrl": "",
    "status": "ACTIVE"
  },
  {
    "id": "preview-Q008",
    "code": "Q008",
    "skill": "READING",
    "level": "B2",
    "prompt": "Despite ____ heavy rain, the match went ahead.",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "the"
      },
      {
        "id": "b",
        "label": "B",
        "text": "of the"
      },
      {
        "id": "c",
        "label": "C",
        "text": "that the"
      },
      {
        "id": "d",
        "label": "D",
        "text": "it was"
      }
    ],
    "correctOptionId": "a",
    "explanation": "Despite đi với một cụm danh từ.",
    "transcript": "",
    "audioUrl": "",
    "status": "ACTIVE"
  },
  {
    "id": "preview-Q009",
    "code": "Q009",
    "skill": "READING",
    "level": "A1",
    "prompt": "We ____ to school every morning.",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "go"
      },
      {
        "id": "b",
        "label": "B",
        "text": "goes"
      },
      {
        "id": "c",
        "label": "C",
        "text": "going"
      },
      {
        "id": "d",
        "label": "D",
        "text": "gone"
      }
    ],
    "correctOptionId": "a",
    "explanation": "We đi với go ở thì hiện tại đơn.",
    "transcript": "",
    "audioUrl": "",
    "status": "ACTIVE"
  },
  {
    "id": "preview-Q010",
    "code": "Q010",
    "skill": "READING",
    "level": "A1",
    "prompt": "There ____ a book on the desk.",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "are"
      },
      {
        "id": "b",
        "label": "B",
        "text": "is"
      },
      {
        "id": "c",
        "label": "C",
        "text": "be"
      },
      {
        "id": "d",
        "label": "D",
        "text": "were"
      }
    ],
    "correctOptionId": "b",
    "explanation": "A book là danh từ số ít.",
    "transcript": "",
    "audioUrl": "",
    "status": "ACTIVE"
  },
  {
    "id": "preview-Q011",
    "code": "Q011",
    "skill": "READING",
    "level": "A2",
    "prompt": "The meeting starts ____ nine o’clock.",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "on"
      },
      {
        "id": "b",
        "label": "B",
        "text": "in"
      },
      {
        "id": "c",
        "label": "C",
        "text": "at"
      },
      {
        "id": "d",
        "label": "D",
        "text": "for"
      }
    ],
    "correctOptionId": "c",
    "explanation": "At đi với giờ cụ thể.",
    "transcript": "",
    "audioUrl": "",
    "status": "ACTIVE"
  },
  {
    "id": "preview-Q012",
    "code": "Q012",
    "skill": "READING",
    "level": "B1",
    "prompt": "This exercise is ____ than the last one.",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "easy"
      },
      {
        "id": "b",
        "label": "B",
        "text": "easier"
      },
      {
        "id": "c",
        "label": "C",
        "text": "easiest"
      },
      {
        "id": "d",
        "label": "D",
        "text": "easily"
      }
    ],
    "correctOptionId": "b",
    "explanation": "So sánh hơn của easy là easier.",
    "transcript": "",
    "audioUrl": "",
    "status": "ACTIVE"
  },
  {
    "id": "preview-Q013",
    "code": "Q013",
    "skill": "READING",
    "level": "B1",
    "prompt": "The report ____ by the team yesterday.",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "completed"
      },
      {
        "id": "b",
        "label": "B",
        "text": "was completed"
      },
      {
        "id": "c",
        "label": "C",
        "text": "has complete"
      },
      {
        "id": "d",
        "label": "D",
        "text": "completes"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Câu bị động ở thì quá khứ đơn.",
    "transcript": "",
    "audioUrl": "",
    "status": "ACTIVE"
  },
  {
    "id": "preview-Q014",
    "code": "Q014",
    "skill": "READING",
    "level": "B2",
    "prompt": "Had I known about the delay, I ____ earlier.",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "leave"
      },
      {
        "id": "b",
        "label": "B",
        "text": "will leave"
      },
      {
        "id": "c",
        "label": "C",
        "text": "would have left"
      },
      {
        "id": "d",
        "label": "D",
        "text": "have left"
      }
    ],
    "correctOptionId": "c",
    "explanation": "Đảo ngữ câu điều kiện loại 3.",
    "transcript": "",
    "audioUrl": "",
    "status": "ACTIVE"
  },
  {
    "id": "preview-Q015",
    "code": "Q015",
    "skill": "LISTENING",
    "level": "A1",
    "prompt": "Where is the nearest post office?",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "At the station"
      },
      {
        "id": "b",
        "label": "B",
        "text": "Left at the next traffic light"
      },
      {
        "id": "c",
        "label": "C",
        "text": "At the airport"
      },
      {
        "id": "d",
        "label": "D",
        "text": "Behind the hotel"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Đối chiếu thông tin được nêu trực tiếp trong đoạn nghe.",
    "transcript": "Turn left at the next traffic light. The post office is on your right.",
    "audioUrl": "",
    "status": "DRAFT"
  },
  {
    "id": "preview-Q016",
    "code": "Q016",
    "skill": "LISTENING",
    "level": "A2",
    "prompt": "What time does the train to Oxford leave?",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "9:45 AM"
      },
      {
        "id": "b",
        "label": "B",
        "text": "10:15 AM"
      },
      {
        "id": "c",
        "label": "C",
        "text": "10:45 AM"
      },
      {
        "id": "d",
        "label": "D",
        "text": "11:15 AM"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Đối chiếu thông tin được nêu trực tiếp trong đoạn nghe.",
    "transcript": "The express train to Oxford will depart at 10:15 AM.",
    "audioUrl": "",
    "status": "DRAFT"
  },
  {
    "id": "preview-Q017",
    "code": "Q017",
    "skill": "LISTENING",
    "level": "B1",
    "prompt": "Why is the speaker calling?",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "To cancel a booking"
      },
      {
        "id": "b",
        "label": "B",
        "text": "To request a replacement"
      },
      {
        "id": "c",
        "label": "C",
        "text": "To find a job"
      },
      {
        "id": "d",
        "label": "D",
        "text": "To leave a review"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Đối chiếu thông tin được nêu trực tiếp trong đoạn nghe.",
    "transcript": "I received a damaged item and would like a replacement.",
    "audioUrl": "",
    "status": "DRAFT"
  },
  {
    "id": "preview-Q018",
    "code": "Q018",
    "skill": "LISTENING",
    "level": "B1",
    "prompt": "What should employees do before Friday?",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "Complete the training"
      },
      {
        "id": "b",
        "label": "B",
        "text": "Book a holiday"
      },
      {
        "id": "c",
        "label": "C",
        "text": "Move offices"
      },
      {
        "id": "d",
        "label": "D",
        "text": "Buy tickets"
      }
    ],
    "correctOptionId": "a",
    "explanation": "Đối chiếu thông tin được nêu trực tiếp trong đoạn nghe.",
    "transcript": "Please complete the safety training before Friday.",
    "audioUrl": "",
    "status": "DRAFT"
  },
  {
    "id": "preview-Q019",
    "code": "Q019",
    "skill": "LISTENING",
    "level": "B2",
    "prompt": "Why does the woman request expedited shipment?",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "To avoid penalties"
      },
      {
        "id": "b",
        "label": "B",
        "text": "To save storage space"
      },
      {
        "id": "c",
        "label": "C",
        "text": "To change the address"
      },
      {
        "id": "d",
        "label": "D",
        "text": "To reduce the quantity"
      }
    ],
    "correctOptionId": "a",
    "explanation": "Đối chiếu thông tin được nêu trực tiếp trong đoạn nghe.",
    "transcript": "We need the parts within forty-eight hours to avoid penalties.",
    "audioUrl": "",
    "status": "DRAFT"
  },
  {
    "id": "preview-Q020",
    "code": "Q020",
    "skill": "LISTENING",
    "level": "B2",
    "prompt": "What is the main concern of the speaker?",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "Market volatility"
      },
      {
        "id": "b",
        "label": "B",
        "text": "Staff holidays"
      },
      {
        "id": "c",
        "label": "C",
        "text": "Office furniture"
      },
      {
        "id": "d",
        "label": "D",
        "text": "Transport costs"
      }
    ],
    "correctOptionId": "a",
    "explanation": "Đối chiếu thông tin được nêu trực tiếp trong đoạn nghe.",
    "transcript": "The recent market volatility requires a more cautious investment strategy.",
    "audioUrl": "",
    "status": "DRAFT"
  },
  {
    "id": "preview-Q021",
    "code": "Q021",
    "skill": "LISTENING",
    "level": "A2",
    "prompt": "What time does the museum open?",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "9:45 AM"
      },
      {
        "id": "b",
        "label": "B",
        "text": "10:15 AM"
      },
      {
        "id": "c",
        "label": "C",
        "text": "10:45 AM"
      },
      {
        "id": "d",
        "label": "D",
        "text": "11:15 AM"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Đối chiếu thông tin được nêu trực tiếp trong đoạn nghe.",
    "transcript": "",
    "audioUrl": "",
    "status": "DRAFT"
  },
  {
    "id": "preview-Q022",
    "code": "Q022",
    "skill": "READING",
    "level": "A1",
    "prompt": "Please turn off the lights ____ you leave the room.",
    "passage": "",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "before"
      },
      {
        "id": "b",
        "label": "B",
        "text": "because"
      },
      {
        "id": "c",
        "label": "C",
        "text": "during"
      },
      {
        "id": "d",
        "label": "D",
        "text": "between"
      }
    ],
    "correctOptionId": "a",
    "explanation": "Before diễn tả hành động cần làm trước khi rời phòng.",
    "transcript": "",
    "audioUrl": "",
    "status": "INACTIVE"
  }
];

export function createPlacementManagementSample(): ManagementState {
  const questions = structuredClone(sampleQuestions);
  const snapshot = structuredClone(questions.slice(0,20));
  const testSets: ManagementState["testSets"] = [
    { id: "preview-set-published", code: "PLT-001", name: "Đánh giá đầu vào tổng quát", version: 2, status: "PUBLISHED", questionIds: snapshot.map(q=>q.id), snapshot: structuredClone(snapshot), createdAt: "2026-11-16T02:00:00.000Z" },
    { id: "preview-set-draft", code: "PLT-004", name: "Bộ đề đầu vào học kỳ mới", version: 1, status: "DRAFT", questionIds: [...snapshot.slice(0,8),...snapshot.slice(14,17)].map(q=>q.id), snapshot: [], createdAt: "2026-11-16T02:10:00.000Z" },
  ];
  const examples: Array<{name:string;kind:"USER"|"GUEST";status:ManagementAttempt["status"]; correct:number|null; claim:string|null}> = [
    {name:"Học viên mẫu 01",kind:"USER",status:"SUBMITTED",correct:16,claim:null},
    {name:"Khách #4829",kind:"GUEST",status:"AUTO_SUBMITTED",correct:12,claim:"Chờ nhận kết quả"},
    {name:"Học viên mẫu 02",kind:"USER",status:"IN_PROGRESS",correct:null,claim:null},
    {name:"Khách #4830",kind:"GUEST",status:"EXPIRED",correct:null,claim:"Không có kết quả"},
    {name:"Học viên mẫu 03",kind:"USER",status:"SUBMITTED",correct:18,claim:null},
  ];
  const attempts: ManagementAttempt[] = examples.map((example,i)=>{
    const answered: Record<string,string|null> = {};
    const final = example.correct !== null;
    snapshot.forEach((q,index)=>{answered[q.id]=final ? index < example.correct! ? q.correctOptionId : index === 19 ? null : q.options.find(o=>o.id!==q.correctOptionId)!.id : example.status==="IN_PROGRESS" && index<3 ? q.options[0].id : null;});
    return {id:`preview-attempt-${i+1}`, name:example.name, kind:example.kind, userId:example.kind==="USER"?`preview-user-${i+1}`:null, testSetId:testSets[0].id,testSetCode:testSets[0].code,testSetVersion:2,
      startedAt:`2026-11-${i<3?"16":"15"}T0${i+2}:00:00.000Z`, endedAt:example.status==="IN_PROGRESS"?null:`2026-11-${i<3?"16":"15"}T0${i+2}:15:00.000Z`,
      status:example.status,correctCount:example.correct,level:example.correct===null?null:example.correct<=5?"A1":example.correct<=10?"A2":example.correct<=15?"B1":"B2",claimStatus:example.claim,snapshot:structuredClone(snapshot),answers:answered};
  });
  return {schemaVersion:1,questions,testSets,attempts};
}
