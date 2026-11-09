import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { catalog, Selection, typeById } from "./taxonomy";
import { Button, styles } from "./ui";
export default function RelatedObservations({
  value,
  onChange,
}: {
  value: Selection;
  onChange: (next: Selection) => void;
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState("");
  const options = Object.values(catalog.types)
    .filter(
      (t) =>
        t.id !== value.typeId &&
        !value.relatedIds.includes(t.id) &&
        `${t.label} ${t.aliases.join(" ")}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .slice(0, 12);
  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.text}>
        Anything else you noticed? · Optional, up to three
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {value.relatedIds.map((id) => (
          <Pressable
            key={id}
            accessibilityRole="checkbox"
            accessibilityLabel={`Remove ${typeById(id)?.label}`}
            accessibilityState={{ checked: true }}
            aria-checked={true}
            onPress={() =>
              onChange({
                ...value,
                relatedIds: value.relatedIds.filter((item) => item !== id),
              })
            }
            style={{
              padding: 12,
              minHeight: 44,
              maxWidth: "100%",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#9ce5d9",
              backgroundColor: "#204347",
            }}
          >
            <Text style={{ color: "#edf6f3" }}>✓ {typeById(id)?.label} ×</Text>
          </Pressable>
        ))}
      </View>
      {value.relatedIds.length < 3 && (
        <Button
          label={open ? "Done adding details" : "＋ Add a related observation"}
          onPress={() => setOpen(!open)}
        />
      )}
      {open && value.relatedIds.length < 3 && (
        <>
          <Text style={styles.text}>
            Only add what you witnessed, without assuming a cause.
          </Text>
          <TextInput
            accessibilityLabel="Find related observations"
            placeholder="Search what else you noticed"
            placeholderTextColor="#9ab3b7"
            style={styles.input}
            value={query}
            onChangeText={setQuery}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {options.map((t) => (
              <Pressable
                key={t.id}
                accessibilityRole="button"
                accessibilityLabel={`Add ${t.label}`}
                style={[styles.button, { maxWidth: "100%" }]}
                onPress={() => {
                  onChange({
                    ...value,
                    relatedIds: [...value.relatedIds, t.id],
                  });
                  setQuery("");
                }}
              >
                <Text style={{ color: "#9ce5d9" }}>＋ {t.label}</Text>
              </Pressable>
            ))}
          </View>
          {!options.length && (
            <Text style={styles.text}>No matches. Try another word.</Text>
          )}
        </>
      )}
    </View>
  );
}
