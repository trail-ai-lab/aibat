"use client"

import * as React from "react"
import { Control, FieldPath, FieldValues } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface TestStatement {
  test: string
  ground_truth?: "acceptable" | "unacceptable"
}

interface TestStatementsSectionProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  testCount: number
  title?: string
  description?: string
}

export function TestStatementsSection<T extends FieldValues>({
  control,
  name,
  testCount,
  title = "Test Statements",
  description = "Add test statements and mark them as acceptable or unacceptable. At least one test is required.",
}: TestStatementsSectionProps<T>) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-4">
        {Array.from({ length: testCount }, (_, i) => (
          <div key={i} className="space-y-2">
            {/* Label Row */}
            <div className="flex justify-between">
              <FormLabel className="text-sm font-medium">
                Test Statement {i + 1}
              </FormLabel>
            </div>

            {/* Input + Radio Group Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
              {/* Test Input: grows */}
              <FormField
                control={control}
                name={`${name}.${i}.test` as FieldPath<T>}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={`Enter test statement ${i + 1}...`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Radio Group: fixed width */}
              <FormField
                control={control}
                name={`${name}.${i}.ground_truth` as FieldPath<T>}
                render={({ field }) => (
                  <FormItem className="shrink-0">
                    <FormControl>
                      <RadioGroup
                        className="flex gap-4"
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="acceptable"
                            id={`acc-${i}`}
                          />
                          <FormLabel
                            htmlFor={`acc-${i}`}
                            className="cursor-pointer"
                          >
                            Acceptable
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="unacceptable"
                            id={`unacc-${i}`}
                          />
                          <FormLabel
                            htmlFor={`unacc-${i}`}
                            className="cursor-pointer"
                          >
                            Unacceptable
                          </FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}