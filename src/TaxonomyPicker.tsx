import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  catalog,
  Selection,
  changeDomain,
  changeTopic,
  domainById,
  topicById,
  typeById,
  searchTypes,
} from "./taxonomy";
import ChoiceSheet from "./ChoiceSheet";
import { Button, styles } from "./ui";
export default function TaxonomyPicker({
  value,
  onChange,
}: {
  value: Selection;
  onChange: (value: Selection) => void;
}) {
  const [search, setSearch] = useState("");
  const domain = domainById(value.domainId ?? ""),
    topic = topicById(value.topicId);
  const results = searchTypes(search, value.domainId);
  return (
    <View style={{ gap: 16 }}>
      <Text
        accessibilityRole="header"
        style={[styles.heading, { fontSize: 25 }]}
      >
        What would you like to report?
      </Text>
      <Text style={styles.text}>
        Choose a category, then narrow it down. You report what you observed;
        staff assess caution or danger separately.
      </Text>
      <TextInput
        accessibilityLabel="Find an observation type"
        placeholder="Find a report, e.g. moose, black ice, outage"
        placeholderTextColor="#9ab3b7"
        value={search}
        onChangeText={setSearch}
        style={styles.input}
      />
      {search.trim().length >= 2 && (
        <View style={styles.card}>
          {results.map((result) => (
            <Button
              key={`${result.topic.id}:${result.type.id}`}
              label={`${result.type.label} · ${result.domain.label}`}
              onPress={() => {
                onChange({
                  domainId: result.domain.id,
                  topicId: result.topic.id,
                  typeId: result.type.id,
                  relatedIds: [],
                });
                setSearch("");
              }}
            />
          ))}
          {results.length === 0 && (
            <Text style={styles.text}>
              No matching types in this category. Choose another category or
              Other observation.
            </Text>
          )}
        </View>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {catalog.domains.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: item.id === value.domainId }}
            onPress={() => onChange(changeDomain(value, item.id))}
            style={{
              width: "48%",
              padding: 14,
              minHeight: 108,
              borderRadius: 18,
              backgroundColor:
                item.id === value.domainId ? "#204347" : "#10282c",
              borderWidth: 1,
              borderColor: item.id === value.domainId ? item.color : "#2b4449",
              gap: 8,
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: item.color,
              }}
            />
            <Text style={{ color: "#edf6f3", fontSize: 16, fontWeight: "600" }}>
              {item.label}
            </Text>
            <Text style={{ color: "#a8c3c3", fontSize: 12, lineHeight: 17 }}>
              {item.description}
            </Text>
          </Pressable>
        ))}
      </View>
      {domain && (
        <ChoiceSheet
          label="Topic"
          value={value.topicId}
          options={catalog.topics
            .filter((t) => t.domainId === domain.id)
            .map((t) => ({ value: t.id, label: t.label }))}
          onChange={(id) => onChange(changeTopic(value, id))}
          placeholder="Choose a topic"
        />
      )}
      {topic && (
        <ChoiceSheet
          label="Observation"
          value={value.typeId}
          options={topic.typeIds.map((id) => ({
            value: id,
            label: catalog.types[id].label,
          }))}
          onChange={(id) =>
            onChange({
              ...value,
              typeId: id,
              relatedIds: value.relatedIds.filter((related) => related !== id),
            })
          }
          placeholder="Choose what you observed"
        />
      )}
      {value.typeId && (
        <Text style={styles.text}>
          {domain?.label} › {topic?.label} › {typeById(value.typeId)?.label}
        </Text>
      )}
    </View>
  );
}
