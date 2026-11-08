import source from "../data/observation-catalog.json";
export type PrivacyClass = "approximate" | "coarse" | "restricted";
export type DomainId =
  | "travel"
  | "wildlife"
  | "outdoors"
  | "weather"
  | "environment"
  | "community"
  | "safety"
  | "discoveries";
export type LegacyCategory = "Safety" | "Outdoors" | "Travel";
export type LegacyKind =
  "hazard" | "smoke" | "flooding" | "wildlife" | "trail" | "aurora" | "road";
export type Answer = string | number;
export type Answers = Record<string, Answer>;
export type DomainDefinition = {
  id: DomainId;
  label: string;
  description: string;
  color: string;
  legacyCategory: LegacyCategory;
  legacyKind: LegacyKind;
  privacyFloor?: PrivacyClass;
};
export type TopicDefinition = {
  id: string;
  domainId: DomainId;
  label: string;
  typeIds: string[];
  privacyFloor?: PrivacyClass;
};
export type TypeDefinition = {
  id: string;
  label: string;
  title: string;
  family: DomainId;
  color: string;
  legacyCategory: LegacyCategory;
  legacyKind: LegacyKind;
  questions: string[];
  privacy: PrivacyClass;
  priority: boolean;
  positive: boolean;
  aliases: string[];
};
export type QuestionDefinition = {
  id: string;
  label: string;
  type: "choice" | "number" | "text";
  options: { value: string; label: string }[];
  min?: number;
  max?: number;
  maxLength?: number;
  showWhen?: { field: string; values: string[] };
  coarseValues?: string[];
  reviewValues?: string[];
  priorityValues?: string[];
};
export type Selection = {
  domainId: DomainId | null;
  topicId: string | null;
  typeId: string | null;
  relatedIds: string[];
};
export const catalog = source as {
  version: number;
  domains: DomainDefinition[];
  topics: TopicDefinition[];
  types: Record<string, TypeDefinition>;
  questions: Record<string, QuestionDefinition>;
};
export const emptySelection = (): Selection => ({
  domainId: null,
  topicId: null,
  typeId: null,
  relatedIds: [],
});
export function domainById(id?: string) {
  return catalog.domains.find((d) => d.id === id);
}
export function topicById(id?: string | null) {
  return catalog.topics.find((t) => t.id === id);
}
export function typeById(id?: string | null) {
  return id ? catalog.types[id] : undefined;
}
export function validPath(selection: Selection) {
  const topic = topicById(selection.topicId);
  return (
    !!selection.domainId &&
    topic?.domainId === selection.domainId &&
    !!selection.typeId &&
    topic.typeIds.includes(selection.typeId)
  );
}
export function selectedTypes(selection: Selection) {
  return [selection.typeId, ...selection.relatedIds].flatMap((id) => {
    const type = typeById(id);
    return type ? [type] : [];
  });
}
export function allowedQuestions(selection: Selection) {
  return [
    ...new Set(selectedTypes(selection).flatMap((type) => type.questions)),
  ].map((id) => catalog.questions[id]);
}
export function visibleQuestion(
  question: QuestionDefinition,
  answers: Answers,
) {
  return (
    !question.showWhen ||
    question.showWhen.values.includes(
      String(answers[question.showWhen.field] ?? ""),
    )
  );
}
export function reconcileAnswers(
  selection: Selection,
  answers: Answers,
): Answers {
  const allowed = allowedQuestions(selection);
  return Object.fromEntries(
    Object.entries(answers).filter(([key]) => {
      const q = allowed.find((q) => q.id === key);
      return !!q && visibleQuestion(q, answers);
    }),
  );
}
export function validateSelection(selection: Selection) {
  if (!validPath(selection))
    throw Error("Choose a category, topic and observation.");
  if (
    selection.relatedIds.length > 3 ||
    new Set(selection.relatedIds).size !== selection.relatedIds.length ||
    selection.relatedIds.includes(selection.typeId ?? "") ||
    selection.relatedIds.some((id) => !typeById(id))
  )
    throw Error("Choose up to three different related observations.");
}
export function normalizeAnswers(
  selection: Selection,
  input: Answers,
): Answers {
  validateSelection(selection);
  const allowed = allowedQuestions(selection);
  const result: Answers = {};
  for (const [key, value] of Object.entries(input)) {
    const q = allowed.find((q) => q.id === key);
    if (!q || !visibleQuestion(q, input))
      throw Error(
        "Some answers no longer belong to this observation. Review your choices.",
      );
    if (typeof value === "string" && !value.trim()) continue;
    if (q.type === "choice") {
      if (
        typeof value !== "string" ||
        !q.options.some((o) => o.value === value)
      )
        throw Error(`Choose a listed answer for ${q.label}`);
      result[key] = value;
    }
    if (q.type === "number") {
      const number = typeof value === "number" ? value : Number(value);
      if (
        !Number.isFinite(number) ||
        !Number.isInteger(number) ||
        number < (q.min ?? 0) ||
        number > (q.max ?? 10000)
      )
        throw Error(
          `Enter a whole number between ${q.min} and ${q.max} for ${q.label}`,
        );
      result[key] = number;
    }
    if (q.type === "text") {
      if (
        typeof value !== "string" ||
        value.trim().length > (q.maxLength ?? 240)
      )
        throw Error(`Keep ${q.label} under ${q.maxLength} characters.`);
      result[key] = value.trim();
    }
  }
  return result;
}
const rank: Record<PrivacyClass, number> = {
  approximate: 0,
  coarse: 1,
  restricted: 2,
};
export function privacyFor(
  selection: Selection,
  answers: Answers,
): PrivacyClass {
  let privacy =
    domainById(selection.domainId ?? "")?.privacyFloor ?? "approximate";
  const promote = (next?: PrivacyClass) => {
    if (next && rank[next] > rank[privacy]) privacy = next;
  };
  promote(topicById(selection.topicId)?.privacyFloor);
  for (const type of selectedTypes(selection)) promote(type.privacy);
  for (const q of allowedQuestions(selection)) {
    if (q.coarseValues?.includes(String(answers[q.id]))) promote("coarse");
    if (q.reviewValues?.includes(String(answers[q.id]))) promote("restricted");
  }
  return privacy;
}
export function priorityFor(selection: Selection, answers: Answers) {
  return (
    selectedTypes(selection).some((t) => t.priority) ||
    allowedQuestions(selection).some((q) =>
      q.priorityValues?.includes(String(answers[q.id])),
    )
  );
}
export function publicLocation(
  selection: Selection,
  answers: Answers,
  location: { name: string; latitude: number; longitude: number },
) {
  const privacy = privacyFor(selection, answers);
  const scale = privacy === "restricted" ? 1 : privacy === "coarse" ? 10 : 100;
  return {
    name:
      privacy === "restricted"
        ? "Regional information"
        : privacy === "coarse"
          ? "Generalized area"
          : location.name.trim().slice(0, 160),
    latitude: Math.round(location.latitude * scale) / scale,
    longitude: Math.round(location.longitude * scale) / scale,
    privacy,
  };
}
export function defaultTitle(selection: Selection, answers: Answers) {
  const type = typeById(selection.typeId);
  if (!type) return "";
  if (type.id === "animal_sighting" || type.id === "animal_encounter") {
    const animal = catalog.questions.animal.options.find(
      (o) => o.value === answers.animal,
    );
    const label =
      answers.animal === "other"
        ? String(answers.other_animal ?? "Animal")
        : animal && animal.value !== "unknown"
          ? animal.label
          : "Animal";
    return `${label} ${type.id === "animal_sighting" ? "sighting" : "encounter"}${answers.encounter_behavior === "attack" ? " · attack reported" : ""}`.slice(
      0,
      100,
    );
  }
  return type.title;
}
export function answerLabel(question: QuestionDefinition, value: Answer) {
  return question.type === "choice"
    ? (question.options.find((o) => o.value === value)?.label ?? String(value))
    : String(value);
}
export function changeDomain(selection: Selection, id: DomainId): Selection {
  const matching = selection.typeId
    ? catalog.topics.find(
        (t) => t.domainId === id && t.typeIds.includes(selection.typeId!),
      )
    : undefined;
  return {
    domainId: id,
    topicId: matching?.id ?? null,
    typeId: matching ? selection.typeId : null,
    relatedIds: matching ? selection.relatedIds : [],
  };
}
export function changeTopic(selection: Selection, id: string): Selection {
  const topic = topicById(id);
  if (!topic || topic.domainId !== selection.domainId)
    throw Error("Choose a topic within this category.");
  return {
    ...selection,
    topicId: id,
    typeId:
      selection.typeId && topic.typeIds.includes(selection.typeId)
        ? selection.typeId
        : null,
    relatedIds:
      selection.typeId && topic.typeIds.includes(selection.typeId)
        ? selection.relatedIds
        : [],
  };
}
export function searchTypes(query: string, domain?: DomainId | null) {
  const q = query.toLocaleLowerCase().trim();
  if (q.length < 2) return [];
  const results: {
    type: TypeDefinition;
    topic: TopicDefinition;
    domain: DomainDefinition;
  }[] = [];
  for (const type of Object.values(catalog.types)) {
    if (![type.label, ...type.aliases].some((s) => s.toLowerCase().includes(q)))
      continue;
    const topic = catalog.topics.find(
      (t) => (!domain || t.domainId === domain) && t.typeIds.includes(type.id),
    );
    const parent = domainById(topic?.domainId);
    if (topic && parent) results.push({ type, topic, domain: parent });
  }
  return results.slice(0, 20);
}
export function legacyPath(
  category: LegacyCategory,
  kind?: LegacyKind,
): Selection {
  if (kind === "wildlife")
    return {
      domainId: "wildlife",
      topicId: "wildlife.sighting",
      typeId: "animal_sighting",
      relatedIds: [],
    };
  if (kind === "trail")
    return {
      domainId: "outdoors",
      topicId: "outdoors.trail",
      typeId: "trail_condition",
      relatedIds: [],
    };
  if (kind === "aurora")
    return {
      domainId: "weather",
      topicId: "weather.sky",
      typeId: "aurora",
      relatedIds: [],
    };
  if (kind === "smoke")
    return {
      domainId: "environment",
      topicId: "environment.fire",
      typeId: "smoke",
      relatedIds: [],
    };
  if (kind === "flooding")
    return {
      domainId: "weather",
      topicId: "weather.water",
      typeId: "flooding",
      relatedIds: [],
    };
  if (category === "Travel")
    return {
      domainId: "travel",
      topicId: "travel.surface",
      typeId: "road_condition",
      relatedIds: [],
    };
  return {
    domainId: category === "Outdoors" ? "outdoors" : "community",
    topicId: category === "Outdoors" ? "outdoors.other" : "community.other",
    typeId: "other",
    relatedIds: [],
  };
}
