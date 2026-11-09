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
import ChoiceChips from "./ChoiceChips";
import { Button, styles } from "./ui";
export default function TaxonomyPicker({
  value,
  onChange,
}: {
  value: Selection;
  onChange: (value: Selection) => void;
}) {
  const [search, setSearch] = useState("");
  const [showGroups, setShowGroups] = useState(!value.domainId);
  const domain = domainById(value.domainId ?? ""),
    topic = topicById(value.topicId);
  const results = searchTypes(search, value.domainId);
  return (
    <View style={{ gap: 16 }}>
      <Text style={styles.text}>
        Choose what fits. You can change your mind at any time.
      </Text>
      <TextInput
        accessibilityLabel="Find an observation type"
        placeholder="Try moose, black ice, or an outage"
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
                setShowGroups(false);
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
      {value.domainId && (
        <Button
          label={
            showGroups ? "Keep this group" : `✓ ${domain?.label} · Change group`
          }
          onPress={() => setShowGroups(!showGroups)}
        />
      )}
      {showGroups && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {catalog.domains.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: item.id === value.domainId }}
              onPress={() => {
                onChange(changeDomain(value, item.id));
                setShowGroups(false);
              }}
              style={{
                width: "48%",
                padding: 14,
                minHeight: 108,
                borderRadius: 18,
                backgroundColor:
                  item.id === value.domainId ? "#204347" : "#10282c",
                borderWidth: 1,
                borderColor:
                  item.id === value.domainId ? item.color : "#2b4449",
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
              <Text
                style={{ color: "#edf6f3", fontSize: 16, fontWeight: "600" }}
              >
                {item.label}
              </Text>
              <Text style={{ color: "#a8c3c3", fontSize: 12, lineHeight: 17 }}>
                {item.description}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {domain && !showGroups && (
        <ChoiceChips
          label="Narrow it down"
          value={value.topicId}
          options={catalog.topics
            .filter((t) => t.domainId === domain.id)
            .map((t) => ({ value: t.id, label: t.label }))}
          onChange={(id) => onChange(changeTopic(value, id))}
        />
      )}
      {topic && !showGroups && (
        <ChoiceChips
          label="What best fits?"
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
